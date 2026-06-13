from app.form_generator import _generate_rule_based


def test_generate_home_buyer_form_uses_specialized_questions():
    schema = _generate_rule_based("Create a home buyer intake form")
    assert "home buyer" in schema.title.lower() or "home buyer" in schema.description.lower()
    detail_questions = schema.sections[1].questions
    assert any(q.label == "Mortgage pre-approved?" for q in detail_questions)
    mortgage = next(q for q in detail_questions if q.label == "Mortgage pre-approved?")
    assert mortgage.type == "multiple_choice"
    assert mortgage.options == ["Yes", "No", "In progress"]


def test_generate_generic_form_has_applicant_section():
    schema = _generate_rule_based("Job application")
    assert len(schema.sections) >= 1
    assert any(q.label == "Full name" for q in schema.sections[0].questions)


def test_generate_form_title():
    schema = _generate_rule_based("Rental property")
    assert "form" in schema.title.lower()
