import json
from datetime import datetime
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from sqlmodel import Session, select

from .config import settings
from .db import get_session, init_db
from .form_generator import generate_form
from .google_service import (
    SCOPES,
    create_google_form_and_sheet,
    credentials_from_db,
    get_client_config,
    save_credentials,
)
from .models import FormDraft, OAuthToken
from .schemas import CloneRequest, DraftResponse, ErrorResponse, GenerateRequest, UpdateDraftRequest

app = FastAPI(title="IntakeForge API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_base_url, "https://intakeforge-sigma.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


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
    save_credentials(session, flow.credentials)
    return RedirectResponse(f"{settings.frontend_base_url}/?connected=1")


@app.get("/auth/google/status")
def google_status(session: Session = Depends(get_session)) -> dict[str, bool]:
    return {"connected": session.get(OAuthToken, 1) is not None}


@app.post("/forms/generate", response_model=DraftResponse, responses={400: {"model": ErrorResponse}})
def create_draft(payload: GenerateRequest, session: Session = Depends(get_session)):
    if not payload.prompt.strip():
        raise HTTPException(400, "Prompt cannot be empty")

    schema = generate_form(payload.prompt, payload.depth)
    draft = FormDraft(
        prompt=payload.prompt,
        title=schema.title,
        description=schema.description,
        schema_json=schema.model_dump_json(),
    )
    session.add(draft)
    session.commit()
    session.refresh(draft)
    return draft_to_response(draft)


@app.get("/forms", response_model=list[DraftResponse])
def list_forms(session: Session = Depends(get_session)):
    drafts = session.exec(select(FormDraft).order_by(FormDraft.created_at.desc())).all()
    return [draft_to_response(d) for d in drafts]


@app.get("/forms/{form_id}", response_model=DraftResponse)
def get_form(form_id: int, session: Session = Depends(get_session)):
    draft = session.get(FormDraft, form_id)
    if not draft:
        raise HTTPException(404, "Not found")
    return draft_to_response(draft)


@app.put("/forms/{form_id}", response_model=DraftResponse, responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}})
def update_form(form_id: int, payload: UpdateDraftRequest, session: Session = Depends(get_session)):
    draft = session.get(FormDraft, form_id)
    if not draft:
        raise HTTPException(404, "Not found")

    if not payload.title.strip():
        raise HTTPException(400, "Title cannot be empty")
    if not payload.schema.sections:
        raise HTTPException(400, "At least one section is required")

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


@app.post("/forms/{form_id}/clone", response_model=DraftResponse, responses={404: {"model": ErrorResponse}})
def clone_form(form_id: int, payload: CloneRequest, session: Session = Depends(get_session)):
    original = session.get(FormDraft, form_id)
    if not original:
        raise HTTPException(404, "Not found")
    clone = FormDraft(
        prompt=original.prompt,
        title=payload.title,
        description=original.description,
        schema_json=original.schema_json,
        approved=False,
        is_template=payload.make_template,
        template_name=payload.template_name if payload.make_template else None,
    )
    session.add(clone)
    session.commit()
    session.refresh(clone)
    return draft_to_response(clone)


@app.get("/templates", response_model=list[DraftResponse])
def list_templates(session: Session = Depends(get_session)):
    templates = session.exec(select(FormDraft).where(FormDraft.is_template == True).order_by(FormDraft.created_at.desc())).all()
    return [draft_to_response(t) for t in templates]


@app.post("/forms/{form_id}/publish", response_model=DraftResponse, responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}})
def publish(form_id: int, session: Session = Depends(get_session)):
    draft = session.get(FormDraft, form_id)
    if not draft:
        raise HTTPException(404, "Not found")

    token = session.get(OAuthToken, 1)
    if not token:
        raise HTTPException(400, "Google not connected")

    creds = credentials_from_db(token)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        save_credentials(session, creds)

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
