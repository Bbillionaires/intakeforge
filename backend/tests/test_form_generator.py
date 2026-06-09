from app.form_generator import generate_form


def test_generate_home_buyer_form_uses_specialized_questions():
    schema = generate_form("Create a home buyer intake form")
    assert "home buyer" in schema.title.lower()
    detail_questions = schema.sections[1].questions
    assert any(q.label == "Mortgage pre-approved?" for q in detail_questions)
    mortgage = next(q for q in detail_questions if q.label == "Mortgage pre-approved?")
    assert mortgage.type == "multiple_choice"
    assert mortgage.options == ["Yes", "No", "In progress"]
