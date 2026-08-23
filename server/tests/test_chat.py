import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.session import Base, get_db
from app.main import app
from app.models import Article, Category, User

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


class ChatEndpointTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=test_engine)
        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        with TestingSessionLocal() as session:
            cat = Category(name="Support", slug="support")
            session.add(cat)
            session.commit()

            art = Article(
                title="Password Reset Guide",
                slug="password-reset-guide",
                content="To reset your password, click on Forgot Password on the login screen.",
                category_id=cat.id,
                status="published",
            )
            session.add(art)
            session.commit()

            user = User(
                full_name="Staff User",
                email="staff@test.com",
                hashed_password=hash_password("pass123"),
                role="viewer",
                is_active=True,
            )
            session.add(user)
            session.commit()

        self.valid_api_key = settings.widget_api_keys_map.get(
            "hmis_mock", "dev-widget-key-change-me"
        )
        self.jwt_token = create_access_token(
            {"sub": "staff@test.com", "role": "viewer"}
        )

    def tearDown(self):
        Base.metadata.drop_all(bind=test_engine)
        app.dependency_overrides.clear()

    def test_widget_chat_with_valid_api_key(self):
        res = self.client.post(
            "/api/v1/chat/",
            json={"session_id": "test-sess-1", "message": "how to reset password?"},
            headers={"X-API-Key": self.valid_api_key},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["session_id"], "test-sess-1")
        self.assertIn("Password Reset Guide", data["reply"])

    def test_chat_uses_llm_reply_when_available(self):
        with patch(
            "app.services.kb_search.generate_grounded_reply",
            return_value="This is the LLM answer from Password Reset Guide",
        ):
            res = self.client.post(
                "/api/v1/chat/",
                json={"session_id": "test-sess-3", "message": "how to reset password?"},
                headers={"X-API-Key": self.valid_api_key},
            )

        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            res.json()["reply"], "This is the LLM answer from Password Reset Guide"
        )

    def test_widget_chat_with_invalid_api_key_fails(self):
        res = self.client.post(
            "/api/v1/chat/",
            json={"session_id": "test-sess-1", "message": "hello"},
            headers={"X-API-Key": "invalid-key-xyz"},
        )
        self.assertEqual(res.status_code, 401)

    def test_chat_history_retrieval(self):
        # Send a message first
        self.client.post(
            "/api/v1/chat/",
            json={"session_id": "test-sess-2", "message": "how to reset password?"},
            headers={"X-API-Key": self.valid_api_key},
        )

        res = self.client.get(
            "/api/v1/chat/history?session_id=test-sess-2",
            headers={"X-API-Key": self.valid_api_key},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["messages"]), 2)  # User question + Bot reply

    def test_chat_with_mixed_timezone_history(self):
        history = [
            {"sender": "user", "message": "hello", "timestamp": "2026-08-24T00:00:00Z"},
            {"sender": "bot", "message": "hi", "timestamp": "2026-08-24T00:01:00"},
        ]
        with patch(
            "app.services.kb_search.generate_grounded_reply",
            return_value="Answer with history.",
        ):
            res = self.client.post(
                "/api/v1/chat/",
                json={
                    "session_id": "test-sess-tz",
                    "message": "how to reset password?",
                    "history": history,
                },
                headers={"X-API-Key": self.valid_api_key},
            )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["reply"], "Answer with history.")


if __name__ == "__main__":
    unittest.main()
