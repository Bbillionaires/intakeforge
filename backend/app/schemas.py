from typing import List, Literal, Optional
from pydantic import BaseModel

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
    depth: Literal["brief", "comprehensive"] = "brief"


class DraftResponse(BaseModel):
    id: int
    prompt: str
    title: str
    description: str
    approved: bool
    schema: FormSchema
    form_edit_link: Optional[str] = None
    form_public_link: Optional[str] = None
    sheet_link: Optional[str] = None


class UpdateDraftRequest(BaseModel):
    title: str
    description: str
    schema: FormSchema
    approved: bool = False


class ErrorResponse(BaseModel):
    detail: str
