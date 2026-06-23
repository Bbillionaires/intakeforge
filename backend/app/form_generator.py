from .schemas import FormSchema, Section, Question
from .config import settings


def _generate_rule_based(prompt: str, depth: str = "brief") -> FormSchema:
    base = prompt.strip().capitalize()
    title = base if "form" in base.lower() else f"{base} Form"
    description = f"Auto-generated intake form for: {prompt.strip()}"

    is_loan = any(w in prompt.lower() for w in ["loan", "mortgage", "lending", "underwrite", "underwriting", "credit", "financing", "borrow"])
    is_home_buyer = "home buyer" in prompt.lower() or "homebuyer" in prompt.lower()

    if is_loan and depth == "comprehensive":
        sections = [
            Section(title="Personal Information", description="Applicant personal details.", questions=[
                Question(label="Full legal name", type="short_text", required=True),
                Question(label="Date of birth", type="date", required=True),
                Question(label="Social Security Number (last 4 digits)", type="short_text", required=True),
                Question(label="Email address", type="short_text", required=True),
                Question(label="Phone number", type="short_text", required=True),
                Question(label="Current residential address", type="long_text", required=True),
                Question(label="How long at current address?", type="short_text", required=True),
                Question(label="Marital status", type="multiple_choice", required=True, options=["Single", "Married", "Divorced", "Widowed"]),
                Question(label="Number of dependents", type="number", required=True),
            ]),
            Section(title="Employment & Income", description="Employment and income verification.", questions=[
                Question(label="Employment status", type="multiple_choice", required=True, options=["Full-time employed", "Part-time employed", "Self-employed", "Retired", "Unemployed"]),
                Question(label="Employer name", type="short_text", required=True),
                Question(label="Job title", type="short_text", required=True),
                Question(label="Length of employment", type="short_text", required=True),
                Question(label="Annual gross income ($)", type="number", required=True),
                Question(label="Additional income sources", type="long_text", required=False),
                Question(label="Additional annual income ($)", type="number", required=False),
            ]),
            Section(title="Loan Request", description="Details about the loan being requested.", questions=[
                Question(label="Loan purpose", type="multiple_choice", required=True, options=["Home purchase", "Refinance", "Auto", "Business", "Personal", "Debt consolidation", "Other"]),
                Question(label="Loan amount requested ($)", type="number", required=True),
                Question(label="Preferred loan term", type="multiple_choice", required=True, options=["12 months", "24 months", "36 months", "48 months", "60 months", "120 months", "180 months", "240 months", "360 months"]),
                Question(label="Collateral available?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Collateral description (if applicable)", type="long_text", required=False),
            ]),
            Section(title="Assets & Liabilities", description="Financial position overview.", questions=[
                Question(label="Checking/savings account balance ($)", type="number", required=True),
                Question(label="Investment/retirement account balance ($)", type="number", required=False),
                Question(label="Real estate owned (estimated value $)", type="number", required=False),
                Question(label="Monthly rent or mortgage payment ($)", type="number", required=True),
                Question(label="Total monthly debt payments ($)", type="number", required=True),
                Question(label="Outstanding credit card balance ($)", type="number", required=False),
                Question(label="Other outstanding loans ($)", type="number", required=False),
            ]),
            Section(title="Credit History", description="Credit and financial history.", questions=[
                Question(label="Estimated credit score range", type="multiple_choice", required=True, options=["Below 580", "580–669", "670–739", "740–799", "800+"]),
                Question(label="Any bankruptcies in the last 7 years?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Any foreclosures in the last 7 years?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Any late payments in the last 12 months?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Please explain any adverse credit history", type="long_text", required=False),
            ]),
            Section(title="Declarations & Consent", description="Required declarations.", questions=[
                Question(label="Are you a US citizen or permanent resident?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Is any part of the down payment borrowed?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="Are you a co-signer on any other loans?", type="multiple_choice", required=True, options=["Yes", "No"]),
                Question(label="I certify all information provided is accurate and complete", type="multiple_choice", required=True, options=["Yes, I certify"]),
            ]),
        ]
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
        if depth == "comprehensive":
            sections.append(Section(title="Additional Preferences", description="More details to find your perfect home.", questions=[
                Question(label="Number of bedrooms", type="multiple_choice", required=True, options=["1", "2", "3", "4", "5+"]),
                Question(label="Number of bathrooms", type="multiple_choice", required=True, options=["1", "1.5", "2", "2.5", "3+"]),
                Question(label="Property type", type="multiple_choice", required=True, options=["Single family", "Condo", "Townhouse", "Multi-family", "Land"]),
                Question(label="Must-have features", type="long_text", required=False),
                Question(label="Deal breakers", type="long_text", required=False),
                Question(label="Currently renting or own?", type="multiple_choice", required=True, options=["Renting", "Own", "Living with family"]),
                Question(label="Working with an agent?", type="multiple_choice", required=True, options=["Yes", "No", "Looking for one"]),
            ]))
    else:
        sections = [
            Section(title="Applicant Information", description="Basic contact details.", questions=[
                Question(label="Full name", type="short_text", required=True),
                Question(label="Email", type="short_text", required=True),
                Question(label="Phone", type="short_text", required=False),
            ]),
            Section(title="Details", description="Specific information required for this request.", questions=[
                Question(label="Primary goal", type="long_text", required=True),
                Question(label="Preferred timeline", type="date", required=False),
                Question(label="Budget range", type="short_text", required=False),
            ]),
        ]
        if depth == "comprehensive":
            sections.append(Section(title="Additional Information", description="Help us understand your needs better.", questions=[
                Question(label="How did you hear about us?", type="multiple_choice", required=False, options=["Referral", "Google", "Social media", "Advertisement", "Other"]),
                Question(label="Have you worked with us before?", type="multiple_choice", required=False, options=["Yes", "No"]),
                Question(label="Any special requirements or considerations?", type="long_text", required=False),
                Question(label="Preferred contact method", type="multiple_choice", required=False, options=["Email", "Phone", "Text"]),
                Question(label="Best time to reach you", type="multiple_choice", required=False, options=["Morning", "Afternoon", "Evening"]),
            ]))

    return FormSchema(title=title, description=description, sections=sections)


def _generate_with_claude(prompt: str, depth: str = "brief") -> FormSchema:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    depth_instruction = (
        "Create a SHORT form with 2-3 sections and 3-5 questions per section covering only the essentials."
        if depth == "brief"
        else "Create a COMPREHENSIVE professional form with 4-6 sections and thorough questions covering all aspects needed for a complete intake. For financial/loan forms include credit, income, assets, employment, and declarations sections."
    )

    tool_schema = {
        "name": "create_form",
        "description": "Create an intake form schema based on the user's description.",
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
        messages=[{"role": "user", "content": f"{depth_instruction}\n\nCreate a professional intake form for: {prompt}"}],
    )

    tool_use = next(b for b in response.content if b.type == "tool_use")
    data = tool_use.input

    sections = []
    for s in data["sections"]:
        questions = []
        for q in s["questions"]:
            questions.append(Question(label=q["label"], type=q["type"], required=q["required"], options=q.get("options")))
        sections.append(Section(title=s["title"], description=s["description"], questions=questions))

    return FormSchema(title=data["title"], description=data["description"], sections=sections)


def generate_form(prompt: str, depth: str = "brief") -> FormSchema:
    if settings.anthropic_api_key:
        try:
            return _generate_with_claude(prompt, depth)
        except Exception:
            pass
    return _generate_rule_based(prompt, depth)
