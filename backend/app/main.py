import json
from datetime import datetime, timedelta
from typing import Any, Optional

import stripe
from fastapi import Depends, FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from google.auth.transport.requests import Request as GoogleRequest
from google_auth_oauthlib.flow import Flow
from jose import JWTError, jwt
from sqlmodel import Session, select

from .config import settings
from .db import get_session, init_db
from .form_generator import generate_form
from .google_service import (
    SCOPES,
    create_google_form_and_sheet,
    credentials_from_db,
    get_client_config,
    get_google_userinfo,
    get_user_token,
    save_credentials,
)
from .models import FormDraft, OAuthToken, User
from .schemas import (
    CloneRequest,
    DraftResponse,
    ErrorResponse,
    GenerateRequest,
    UpdateDraftRequest,
    UserResponse,
)

stripe.api_key = settings.stripe_secret_key

app = FastAPI(title="IntakeForge API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30


@app.on_event("startup")
def startup() -> None:
    init_db()


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.secret_key, algorithm=JWT_ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, ValueError):
        raise HTTPException(401, "Invalid token")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user


def get_current_user_optional(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
        return session.get(User, int(payload["sub"]))
    except Exception:
        return None


# ── Billing helpers ───────────────────────────────────────────────────────────

def reset_monthly_usage_if_needed(user: User, session: Session) -> None:
    if datetime.utcnow() - user.billing_period_start > timedelta(days=30):
        user.forms_used_this_month = 0
        user.billing_period_start = datetime.utcnow()
        session.add(user)
        session.commit()


def check_form_limit(user: User) -> None:
    if user.plan == "pro":
        return
    if user.forms_used_this_month >= settings.free_forms_per_month:
        raise HTTPException(402, f"Free plan limit reached ({settings.free_forms_per_month} forms/month). Upgrade to Pro.")


def check_depth_limit(user: User, depth: int) -> None:
    if user.plan == "pro":
        return
    if depth > settings.free_max_depth:
        raise HTTPException(402, f"Depth {depth} requires Pro plan. Free plan supports depth 1–{settings.free_max_depth}.")


# ── Response helpers ──────────────────────────────────────────────────────────

def draft_to_response(draft: FormDraft) -> DraftResponse:
    return DraftResponse(
        id=draft.id,
        prompt=draft.prompt,
        title=draft.title,
        description=draft.description,
        approved=draft.approved,
        is_template=draft.is_template,
        template_name=draft.template_name,
        schema=json.loads(draft.schema_json),
        form_edit_link=draft.form_edit_link,
        form_public_link=draft.form_public_link,
        sheet_link=draft.sheet_link,
    )


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/auth/google/login")
def google_login() -> dict[str, str]:
    flow = Flow.from_client_config(
        get_client_config(), scopes=SCOPES, redirect_uri=settings.google_redirect_uri
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline", include_granted_scopes="true", prompt="consent"
    )
    return {"auth_url": auth_url}


@app.get("/auth/google/callback")
def google_callback(code: str, session: Session = Depends(get_session)):
    flow = Flow.from_client_config(
        get_client_config(), scopes=SCOPES, redirect_uri=settings.google_redirect_uri
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    userinfo = get_google_userinfo(creds.token)
    google_sub = userinfo["sub"]

    user = session.exec(select(User).where(User.google_sub == google_sub)).first()
    if not user:
        user = User(
            google_sub=google_sub,
            email=userinfo.get("email", ""),
            name=userinfo.get("name", ""),
            picture=userinfo.get("picture", ""),
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    save_credentials(session, creds, user.id)
    token = create_token(user.id)
    return RedirectResponse(f"{settings.frontend_base_url}/?token={token}")


@app.get("/auth/google/status")
def google_status(user: Optional[User] = Depends(get_current_user_optional)) -> dict:
    if not user:
        return {"connected": False}
    return {
        "connected": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "plan": user.plan,
            "forms_used_this_month": user.forms_used_this_month,
            "free_forms_per_month": settings.free_forms_per_month,
            "free_max_depth": settings.free_max_depth,
        }
    }


# ── Forms ─────────────────────────────────────────────────────────────────────

@app.post("/forms/generate", response_model=DraftResponse, responses={400: {"model": ErrorResponse}})
def create_draft(
    payload: GenerateRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if not payload.prompt.strip():
        raise HTTPException(400, "Prompt cannot be empty")

    reset_monthly_usage_if_needed(user, session)
    check_form_limit(user)
    check_depth_limit(user, payload.depth)

    schema = generate_form(payload.prompt, payload.depth)
    draft = FormDraft(
        user_id=user.id,
        prompt=payload.prompt,
        title=schema.title,
        description=schema.description,
        schema_json=schema.model_dump_json(),
    )
    session.add(draft)
    user.forms_used_this_month += 1
    session.add(user)
    session.commit()
    session.refresh(draft)
    return draft_to_response(draft)


@app.get("/forms", response_model=list[DraftResponse])
def list_forms(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    drafts = session.exec(
        select(FormDraft).where(FormDraft.user_id == user.id).order_by(FormDraft.created_at.desc())
    ).all()
    return [draft_to_response(d) for d in drafts]


@app.get("/forms/{form_id}", response_model=DraftResponse)
def get_form(form_id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    draft = session.get(FormDraft, form_id)
    if not draft or draft.user_id != user.id:
        raise HTTPException(404, "Not found")
    return draft_to_response(draft)


@app.put("/forms/{form_id}", response_model=DraftResponse)
def update_form(
    form_id: int,
    payload: UpdateDraftRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    draft = session.get(FormDraft, form_id)
    if not draft or draft.user_id != user.id:
        raise HTTPException(404, "Not found")
    if not payload.title.strip():
        raise HTTPException(400, "Title cannot be empty")
    if not payload.schema.sections:
        raise HTTPException(400, "At least one section is required")
    if payload.is_template and user.plan != "pro":
        raise HTTPException(402, "Templates require Pro plan.")

    draft.title = payload.title
    draft.description = payload.description
    draft.schema_json = payload.schema.model_dump_json()
    draft.approved = payload.approved
    draft.is_template = payload.is_template
    draft.template_name = payload.template_name
    draft.updated_at = datetime.utcnow()
    session.add(draft)
    session.commit()
    session.refresh(draft)
    return draft_to_response(draft)


@app.post("/forms/{form_id}/clone", response_model=DraftResponse)
def clone_form(
    form_id: int,
    payload: CloneRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    original = session.get(FormDraft, form_id)
    if not original:
        raise HTTPException(404, "Not found")

    reset_monthly_usage_if_needed(user, session)
    check_form_limit(user)

    if payload.make_template and user.plan != "pro":
        raise HTTPException(402, "Saving templates requires Pro plan.")

    clone = FormDraft(
        user_id=user.id,
        prompt=original.prompt,
        title=payload.title,
        description=original.description,
        schema_json=original.schema_json,
        approved=False,
        is_template=payload.make_template,
        template_name=payload.template_name if payload.make_template else None,
    )
    session.add(clone)
    user.forms_used_this_month += 1
    session.add(user)
    session.commit()
    session.refresh(clone)
    return draft_to_response(clone)


@app.get("/templates", response_model=list[DraftResponse])
def list_templates(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    templates = session.exec(
        select(FormDraft)
        .where(FormDraft.user_id == user.id, FormDraft.is_template == True)
        .order_by(FormDraft.created_at.desc())
    ).all()
    return [draft_to_response(t) for t in templates]


@app.post("/forms/{form_id}/publish", response_model=DraftResponse)
def publish(form_id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    draft = session.get(FormDraft, form_id)
    if not draft or draft.user_id != user.id:
        raise HTTPException(404, "Not found")

    token = get_user_token(session, user.id)
    if not token:
        raise HTTPException(400, "Google not connected")

    creds = credentials_from_db(token)
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        save_credentials(session, creds, user.id)

    result: dict[str, Any] = create_google_form_and_sheet(creds, json.loads(draft.schema_json))
    draft.approved = True
    draft.google_form_id = result["form_id"]
    draft.form_edit_link = result["form_edit_link"]
    draft.form_public_link = result["form_public_link"]
    draft.sheet_id = result["sheet_id"]
    draft.sheet_link = result["sheet_link"]
    draft.updated_at = datetime.utcnow()
    session.add(draft)
    session.commit()
    session.refresh(draft)
    return draft_to_response(draft)


# ── Billing ───────────────────────────────────────────────────────────────────

@app.post("/billing/checkout")
def create_checkout(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not settings.stripe_secret_key or not settings.stripe_pro_price_id:
        raise HTTPException(500, "Stripe not configured")

    customer_id = user.stripe_customer_id
    if not customer_id:
        customer = stripe.Customer.create(email=user.email, name=user.name)
        customer_id = customer.id
        user.stripe_customer_id = customer_id
        session.add(user)
        session.commit()

    checkout = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.frontend_base_url}/?upgraded=1",
        cancel_url=f"{settings.frontend_base_url}/?upgrade=cancelled",
    )
    return {"url": checkout.url}


@app.post("/billing/portal")
def billing_portal(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if not user.stripe_customer_id:
        raise HTTPException(400, "No billing account found")
    portal = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_base_url}/",
    )
    return {"url": portal.url}


@app.post("/billing/webhook")
async def stripe_webhook(request: Request, session: Session = Depends(get_session)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except Exception:
        raise HTTPException(400, "Invalid webhook")

    if event["type"] in ("customer.subscription.created", "customer.subscription.updated"):
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        status = sub["status"]
        user = session.exec(select(User).where(User.stripe_customer_id == customer_id)).first()
        if user:
            user.plan = "pro" if status == "active" else "free"
            user.stripe_subscription_id = sub["id"]
            session.add(user)
            session.commit()

    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        user = session.exec(select(User).where(User.stripe_customer_id == customer_id)).first()
        if user:
            user.plan = "free"
            session.add(user)
            session.commit()

    return {"ok": True}
