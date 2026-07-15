import json
from datetime import datetime
from typing import Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import httpx

from .config import settings
from .models import OAuthToken

SCOPES = [
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/forms.responses.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def get_client_config() -> dict[str, Any]:
    return {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }


def credentials_from_db(token_row: OAuthToken) -> Credentials:
    data = json.loads(token_row.token_json)
    return Credentials.from_authorized_user_info(data, SCOPES)


def save_credentials(session, creds: Credentials, user_id: int) -> OAuthToken:
    data = creds.to_json()
    from sqlmodel import select
    token = session.exec(select(OAuthToken).where(OAuthToken.user_id == user_id)).first()
    if token:
        token.token_json = data
        token.updated_at = datetime.utcnow()
    else:
        token = OAuthToken(user_id=user_id, token_json=data)
        session.add(token)
    session.commit()
    return token


def get_google_userinfo(access_token: str) -> dict:
    resp = httpx.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    resp.raise_for_status()
    return resp.json()


def get_user_token(session, user_id: int) -> OAuthToken | None:
    from sqlmodel import select
    return session.exec(select(OAuthToken).where(OAuthToken.user_id == user_id)).first()


def create_google_form_and_sheet(creds: Credentials, schema: dict):
    forms_service = build("forms", "v1", credentials=creds)
    form_body = {"info": {"title": schema["title"], "documentTitle": schema["title"]}}
    created = forms_service.forms().create(body=form_body).execute()
    form_id = created["formId"]

    requests = []
    index = 0
    for section in schema["sections"]:
        requests.append({
            "createItem": {
                "item": {
                    "title": section["title"],
                    "description": section.get("description", ""),
                    "pageBreakItem": {}
                },
                "location": {"index": index}
            }
        })
        index += 1
        for q in section["questions"]:
            q_description = ""
            if q["type"] == "date":
                q_description = "Please answer using a date value."
            elif q["type"] == "number":
                q_description = "Please answer using a numeric value."

            qtype = q["type"]
            required = q.get("required", False)

            if qtype in ("multiple_choice", "checkbox") and q.get("options"):
                choice_type = "RADIO" if qtype == "multiple_choice" else "CHECKBOX"
                question_item = {
                    "title": q["label"],
                    "description": q_description,
                    "questionItem": {
                        "question": {
                            "required": required,
                            "choiceQuestion": {
                                "type": choice_type,
                                "options": [{"value": o} for o in q["options"]],
                            },
                        }
                    },
                }
            elif qtype == "long_text":
                question_item = {
                    "title": q["label"],
                    "description": q_description,
                    "questionItem": {
                        "question": {
                            "required": required,
                            "textQuestion": {"paragraph": True},
                        }
                    },
                }
            else:
                question_item = {
                    "title": q["label"],
                    "description": q_description,
                    "questionItem": {
                        "question": {
                            "required": required,
                            "textQuestion": {},
                        }
                    },
                }

            requests.append({"createItem": {"item": question_item, "location": {"index": index}}})
            index += 1

    if requests:
        forms_service.forms().batchUpdate(formId=form_id, body={"requests": requests}).execute()

    sheets_service = build("sheets", "v4", credentials=creds)
    new_sheet = sheets_service.spreadsheets().create(
        body={"properties": {"title": f"{schema['title']} Responses"}}
    ).execute()
    sheet_id = new_sheet["spreadsheetId"]

    return {
        "form_id": form_id,
        "form_edit_link": f"https://docs.google.com/forms/d/{form_id}/edit",
        "form_public_link": created.get("responderUri", f"https://docs.google.com/forms/d/{form_id}/viewform"),
        "sheet_id": sheet_id,
        "sheet_link": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit",
    }
