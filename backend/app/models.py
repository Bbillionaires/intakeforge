from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class OAuthToken(SQLModel, table=True):
    id: Optional[int] = Field(default=1, primary_key=True)
    token_json: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FormDraft(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt: str
    title: str
    description: str
    schema_json: str
    approved: bool = False
    is_template: bool = False
    template_name: Optional[str] = None
    google_form_id: Optional[str] = None
    form_edit_link: Optional[str] = None
    form_public_link: Optional[str] = None
    sheet_id: Optional[str] = None
    sheet_link: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
