from typing import List, Literal, Optional
from pydantic import BaseModel, Field

QuestionType = Literal["short_text", "long_text", "multiple_choice", "checkbox", "date", "number"]


class Question(BaseModel):
    label: str
    type: QuestionType
    required: bool = False
    options: Optional[List[str]] = None


class Section(BaseModel):
    title: str
    description: str = ""
    questions: List[Question]


class FormSchema(BaseModel):
    title: str
    description: str
    sections: List[Section]


class GenerateRequest(BaseModel):
    prompt: str
    depth: int = Field(default=5, ge=1, le=10)


class CloneRequest(BaseModel):
    title: str
    make_template: bool = False
    template_name: Optional[str] = None


class DraftResponse(BaseModel):
    id: int
    prompt: str
    title: str
    description: str
    approved: bool
    is_template: bool = False
    template_name: Optional[str] = None
    schema: FormSchema
    form_edit_link: Optional[str] = None
    form_public_link: Optional[str] = None
    sheet_link: Optional[str] = None


class UpdateDraftRequest(BaseModel):
    title: str
    description: str
    schema: FormSchema
    approved: bool = False
    is_template: bool = False
    template_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    picture: str
    plan: str
    forms_used_this_month: int
    free_forms_per_month: int
    free_max_depth: int


class ErrorResponse(BaseModel):
    detail: str
