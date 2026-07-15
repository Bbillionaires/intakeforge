from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine

from app.db import get_session
from app.main import app


def setup_test_app():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    return TestClient(app)


def test_generate_update_list_flow():
    client = setup_test_app()

    generate = client.post("/forms/generate", json={"prompt": "Create a home buyer intake form"})
    assert generate.status_code == 200
    draft = generate.json()
    assert draft["id"] > 0
    assert draft["schema"]["sections"]

    draft_id = draft["id"]
    draft["title"] = "Updated title"
    update = client.put(
        f"/forms/{draft_id}",
        json={
            "title": draft["title"],
            "description": draft["description"],
            "approved": True,
            "schema": draft["schema"],
        },
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Updated title"
    assert update.json()["approved"] is True

    listed = client.get("/forms")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_publish_requires_google_connection():
    client = setup_test_app()

    generate = client.post("/forms/generate", json={"prompt": "Create a form"})
    draft_id = generate.json()["id"]

    publish = client.post(f"/forms/{draft_id}/publish")
    assert publish.status_code == 400
    assert publish.json()["detail"] == "Google not connected"


def test_generate_rejects_empty_prompt():
    client = setup_test_app()
    response = client.post("/forms/generate", json={"prompt": "   "})
    assert response.status_code == 400
    assert response.json()["detail"] == "Prompt cannot be empty"
