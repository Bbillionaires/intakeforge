from .schemas import FormSchema, Section, Question


def generate_form(prompt: str) -> FormSchema:
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
