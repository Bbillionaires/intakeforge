from .schemas import FormSchema, Section, Question
from .config import settings


def _depth_instruction(depth: int) -> str:
    if depth <= 2:
        return "Create a VERY SHORT form with 1-2 sections and 2-3 essential questions total. Bare minimum only."
    elif depth <= 4:
        return "Create a BRIEF form with 2 sections and 3-4 questions per section. Keep it simple."
    elif depth <= 6:
        return "Create a STANDARD form with 3-4 sections and 4-5 questions per section. Cover all typical needs."
    elif depth <= 8:
        return "Create a DETAILED form with 4-5 sections and 5-7 questions per section. Be thorough and professional."
    else:
        return "Create a COMPREHENSIVE government-level form with 5-7 sections and 6-10 questions per section. Cover every aspect including declarations, legal disclosures, financial details, and verification fields. Leave nothing out."


def _generate_rule_based(prompt: str, depth: int = 5) -> FormSchema:
    base = prompt.strip().capitalize()
    title = base if "form" in base.lower() else f"{base} Form"
    description = f"Auto-generated intake form for: {prompt.strip()}"

    is_loan = any(w in prompt.lower() for w in ["loan", "mortgage", "lending", "underwrite", "underwriting", "credit", "financing", "borrow"])
    is_home_buyer = "home buyer" in prompt.lower() or "homebuyer" in prompt.lower()

    if is_loan:
        base_sections = [
            Section(title="Personal Information", description="Applicant personal details.", questions=[
                Question(label="Full legal name", type="short_text", required=True),
                Question(label="Email address", type="short_text", required=True),
                Question(label="Phone number", type="short_text", required=True),
            ]),
            Section(title="Loan Request", description="Details about the loan.", questions=[
                Question(label="Loan amount requested ($)", type="number", required=True),
                Question(label="Loan purpose", type="multiple_choice", required=True, options=["Home purchase", "Refinance", "Auto", "Business", "Personal", "Debt consolidation", "Other"]),
            ]),
        ]
        if depth >= 4:
            base_sections[0].questions += [
                Question(label="Date of birth", type="date", required=True),
                Question(label="Current residential address", type="long_text", required=True),
            ]
            base_sections[1].questions += [
                Question(label="Preferred loan term", type="multiple_choice", required=True, options=["12 months", "24 months", "36 months", "60 months", "120 months", "180 months", "360 months"]),
            ]
        if depth >= 6:
            base_sections[0].questions += [
                Question(label="Social Security Number (last 4 digits)", type="short_text", required=True),
                Question(label="Marital status", type="multiple_choice", required=True, options=["Single", "Married", "Divorced", "Widowed"]),
                Question(label="Number of dependents", type="number", required=True),
            ]
            base_sections.append(Section(title="Employment & Income", description="Employment and income verification.", questions=[
                Question(label="Employment status", type="multiple_choice", required=True, options=["Full-time", "Part-time", "Self-employed", "Retired", "Unemployed"]),
                Question(label="Employer name", type="short_text", required=True),
                Question(label="Annual gross income ($)", type="number", required=True),
                Question(label="Length of employment", type="short_text", required=True),
            ]))
            base_sections.append(Section(title="Assets & Liabilities", description="Financial position.", questions=[
                Question(label="Checking/savings balance ($)", type="number", required=True),
                Question(label="Monthly debt payments ($)", type="number", required=True),
                Question(label="Monthly rent or mortgage ($)", type="number", required=True),
            ]))
        if depth >= 8:
            base_sections[1].questions += [
                Question(label="Collateral available?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Collateral description", type="long_text", required=False),
            ]
            base_sections.append(Section(title="Credit History", description="Credit and financial history.", questions=[
                Question(label="Estimated credit score range", type="multiple_choice", required=True, options=["Below 580", "580–669", "670–739", "740–799", "800+"]),
                Question(label="Any bankruptcies in the last 7 years?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Any foreclosures in the last 7 years?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Any late payments in the last 12 months?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Please explain any adverse credit history", type="long_text", required=False),
            ]))
        if depth >= 9:
            base_sections.append(Section(title="Additional Income & Assets", description="Complete financial picture.", questions=[
                Question(label="Additional income sources", type="long_text", required=False),
                Question(label="Additional annual income ($)", type="number", required=False),
                Question(label="Investment/retirement account balance ($)", type="number", required=False),
                Question(label="Real estate owned (estimated value $)", type="number", required=False),
                Question(label="Outstanding credit card balance ($)", type="number", required=False),
                Question(label="Other outstanding loans ($)", type="number", required=False),
            ]))
            base_sections.append(Section(title="Declarations & Consent", description="Required legal declarations.", questions=[
                Question(label="Are you a US citizen or permanent resident?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Is any part of the down payment borrowed?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Are you a co-signer on any other loans?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Are there any outstanding judgments against you?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Have you been party to a lawsuit in the last 3 years?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="I certify all information provided is accurate and complete", type="multiple_choice", required=True, options=["Yes, I certify"]),
            ]))
        sections = base_sections

    elif is_home_buyer:
        sections = [
            Section(title="Applicant Information", description="Basic contact details.", questions=[
                Question(label="Full name", type="short_text", required=True),
                Question(label="Email", type="short_text", required=True),
                Question(label="Phone", type="short_text", required=False),
            ]),
            Section(title="Home Search Details", description="Details about your home search.", questions=[
                Question(label="Target location", type="short_text", required=True),
                Question(label="Price range", type="short_text", required=True),
                Question(label="Mortgage pre-approved?", type="multiple_choice", required=True, options=["Yes", "No", "In progress"]),
                Question(label="Desired move-in date", type="date", required=False),
            ]),
        ]
        if depth >= 5:
            sections.append(Section(title="Property Preferences", description="What you're looking for.", questions=[
                Question(label="Number of bedrooms", type="multiple_choice", required=True, options=["1", "2", "3", "4", "5+"]),
                Question(label="Number of bathrooms", type="multiple_choice", required=True, options=["1", "1.5", "2", "2.5", "3+"]),
                Question(label="Property type", type="multiple_choice", required=True, options=["Single family", "Condo", "Townhouse", "Multi-family", "Land"]),
                Question(label="Must-have features", type="long_text", required=False),
            ]))
        if depth >= 8:
            sections.append(Section(title="Financial & Agent Info", description="Additional details.", questions=[
                Question(label="Currently renting or own?", type="multiple_choice", required=True, options=["Renting", "Own", "Living with family"]),
                Question(label="Working with an agent?", type="multiple_choice", required=True, options=["Yes", "No", "Looking for one"]),
                Question(label="Down payment available (%)", type="multiple_choice", required=True, options=["Less than 5%", "5–10%", "10–20%", "20%+", "Not sure"]),
                Question(label="Deal breakers", type="long_text", required=False),
            ]))
    else:
        sections = [
            Section(title="Applicant Information", description="Basic contact details.", questions=[
                Question(label="Full name", type="short_text", required=True),
                Question(label="Email", type="short_text", required=True),
            ]),
            Section(title="Details", description="Specific information for this request.", questions=[
                Question(label="Primary goal", type="long_text", required=True),
            ]),
        ]
        if depth >= 4:
            sections[0].questions.append(Question(label="Phone", type="short_text", required=False))
            sections[1].questions += [
                Question(label="Preferred timeline", type="date", required=False),
                Question(label="Budget range", type="short_text", required=False),
            ]
        if depth >= 7:
            sections.append(Section(title="Additional Information", description="Help us understand your needs.", questions=[
                Question(label="How did you hear about us?", type="multiple_choice", required=False, options=["Referral", "Google", "Social media", "Advertisement", "Other"]),
                Question(label="Have you worked with us before?", type="multiple_choice", required=False, options=["Yes", "No"]),
                Question(label="Special requirements or considerations?", type="long_text", required=False),
                Question(label="Preferred contact method", type="multiple_choice", required=False, options=["Email", "Phone", "Text"]),
                Question(label="Best time to reach you", type="multiple_choice", required=False, options=["Morning", "Afternoon", "Evening"]),
            ]))

    return FormSchema(title=title, description=description, sections=sections)


def _generate_with_claude(prompt: str, depth: int = 5) -> FormSchema:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    tool_schema = {
        "name": "create_form",
        "description": "Create an intake form schema.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
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
                                        "type": {"type": "string", "enum": ["short_text", "long_text", "multiple_choice", "checkbox", "date", "number"]},
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
        max_tokens=4096,
        tools=[tool_schema],
        tool_choice={"type": "tool", "name": "create_form"},
        messages=[{"role": "user", "content": f"{_depth_instruction(depth)}\n\nCreate a professional intake form for: {prompt}"}],
    )

    tool_use = next(b for b in response.content if b.type == "tool_use")
    data = tool_use.input

    sections = []
    for s in data["sections"]:
        questions = [
            Question(label=q["label"], type=q["type"], required=q["required"], options=q.get("options"))
            for q in s["questions"]
        ]
        sections.append(Section(title=s["title"], description=s["description"], questions=questions))

    return FormSchema(title=data["title"], description=data["description"], sections=sections)


def generate_form(prompt: str, depth: int = 5) -> FormSchema:
    if settings.anthropic_api_key:
        try:
            return _generate_with_claude(prompt, depth)
        except Exception:
            pass
    return _generate_rule_based(prompt, depth)
