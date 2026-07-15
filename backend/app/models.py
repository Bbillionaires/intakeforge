from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    google_sub: str = Field(unique=True, index=True)
    email: str
    name: str = ""
    picture: str = ""
    plan: str = "free"  # "free" or "pro"
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    forms_used_this_month: int = 0
    billing_period_start: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class OAuthToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    token_json: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FormDraft(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
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
