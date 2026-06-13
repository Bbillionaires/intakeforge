from .schemas import FormSchema, Section, Question
from .config import settings


def _generate_rule_based(prompt: str) -> FormSchema:
    base = prompt.strip().capitalize()
    title = base if "form" in base.lower() else f"{base} Form"
    description = f"Auto-generated intake form for: {prompt.strip()}"

    sections = [
        Section(
            title="Applicant Information",
            description="Basic contact details.",
            questions=[
                Question(label="Full name", type="short_text", required=True),
                Question(label="Email", type="short_text", required=True),
                Question(label="Phone", type="short_text", required=False),
            ],
        ),
        Section(
            title="Details",
            description="Specific information required for this request.",
            questions=[
                Question(label="Primary goal", type="long_text", required=True),
                Question(label="Preferred timeline", type="date", required=False),
                Question(label="Budget range", type="short_text", required=False),
            ],
        ),
    ]

    if "home buyer" in prompt.lower() or "homebuyer" in prompt.lower():
        sections[1].questions = [
            Question(label="Target location", type="short_text", required=True),
            Question(label="Price range", type="short_text", required=True),
            Question(label="Mortgage pre-approved?", type="multiple_choice", required=True, options=["Yes", "No", "In progress"]),
            Question(label="Desired move-in date", type="date", required=False),
        ]

    return FormSchema(title=title, description=description, sections=sections)


def _generate_with_claude(prompt: str) -> FormSchema:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    tool_schema = {
        "name": "create_form",
        "description": "Create an intake form schema based on the user's description.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Form title"},
                "description": {"type": "string", "description": "Form description"},
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "questions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "label": {"type": "string"},
                                        "type": {
                                            "type": "string",
                                            "enum": ["short_text", "long_text", "multiple_choice", "checkbox", "date", "number"],
                                        },
                                        "required": {"type": "boolean"},
                                        "options": {"type": "array", "items": {"type": "string"}},
                                    },
                                    "required": ["label", "type", "required"],
                                },
                            },
                        },
                        "required": ["title", "description", "questions"],
                    },
                },
            },
            "required": ["title", "description", "sections"],
        },
    }

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2048,
        tools=[tool_schema],
        tool_choice={"type": "tool", "name": "create_form"},
        messages=[{"role": "user", "content": f"Create a professional intake form for: {prompt}"}],
    )

    tool_use = next(b for b in response.content if b.type == "tool_use")
    data = tool_use.input

    sections = []
    for s in data["sections"]:
        questions = []
        for q in s["questions"]:
            questions.append(
                Question(
                    label=q["label"],
                    type=q["type"],
                    required=q["required"],
                    options=q.get("options"),
                )
            )
        sections.append(Section(title=s["title"], description=s["description"], questions=questions))

    return FormSchema(title=data["title"], description=data["description"], sections=sections)


def generate_form(prompt: str) -> FormSchema:
    if settings.anthropic_api_key:
        try:
            return _generate_with_claude(prompt)
        except Exception:
            pass
    return _generate_rule_based(prompt)
