import json
from datetime import datetime
from typing import Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .config import settings
from .models import OAuthToken

SCOPES = [
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/forms.responses.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
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


def save_credentials(session, creds: Credentials) -> None:
    data = creds.to_json()
    token = session.get(OAuthToken, 1)
    if token:
        token.token_json = data
        token.updated_at = datetime.utcnow()
    else:
        token = OAuthToken(id=1, token_json=data)
        session.add(token)
    session.commit()


def create_google_form_and_sheet(creds: Credentials, schema: dict):
    forms_service = build("forms", "v1", credentials=creds)
    form_body = {"info": {"title": schema["title"], "documentTitle": schema["title"]}}
    created = forms_service.forms().create(body=form_body).execute()
    form_id = created["formId"]

    requests = []
    index = 0
    for section in schema["sections"]:
        requests.append({"createItem": {"item": {"title": section["title"], "description": section.get("description", ""), "pageBreakItem": {}}, "location": {"index": index}}})
        index += 1
        for q in section["questions"]:
            q_description = ""
            if q["type"] == "date":
                q_description = "Please answer using a date value."
            elif q["type"] == "number":
                q_description = "Please answer using a numeric value."

            question_item = {
                "title": q["label"],
                "description": q_description,
                "questionItem": {
                    "question": {
                        "required": q.get("required", False),
                        "textQuestion": {}
                    }
                }
            }
            qtype = q["type"]
            if qtype in ("multiple_choice", "checkbox") and q.get("options"):
                choice_type = "RADIO" if qtype == "multiple_choice" else "CHECKBOX"
                question_item["questionItem"]["question"] = {
                    "required": q.get("required", False),
                    "choiceQuestion": {
                        "type": choice_type,
                        "options": [{"value": o} for o in q["options"]],
                    },
                }
            requests.append({"createItem": {"item": question_item, "location": {"index": index}}})
            index += 1

    forms_service.forms().batchUpdate(formId=form_id, body={"requests": requests}).execute()
    sheets = build("sheets", "v4", credentials=creds)
    new_sheet = sheets.spreadsheets().create(body={"properties": {"title": f"{schema['title']} Responses"}}).execute()
    sheet_id = new_sheet["spreadsheetId"]

    forms_service.forms().setDestination(
        formId=form_id,
        body={"destinationType": "SPREADSHEET", "spreadsheetId": sheet_id},
    ).execute()

    return {
        "form_id": form_id,
        "form_edit_link": f"https://docs.google.com/forms/d/{form_id}/edit",
        "form_public_link": created.get("responderUri", f"https://docs.google.com/forms/d/{form_id}/viewform"),
        "sheet_id": sheet_id,
        "sheet_link": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit",
    }
