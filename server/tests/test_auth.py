import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.db.session import Base, get_db
from app.main import app
from app.models import User

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


class AuthFlowTests(unittest.TestCase):
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

    def tearDown(self):
        Base.metadata.drop_all(bind=test_engine)
        app.dependency_overrides.clear()

    def test_login_returns_token_for_registered_user(self):
        with TestingSessionLocal() as session:
            user = User(
                full_name="Test User",
                email="test@example.com",
                hashed_password=hash_password("secret123"),
                role="staff",
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            session.commit()

        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "test@example.com", "password": "secret123"},
            headers={"content-type": "application/x-www-form-urlencoded"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("access_token", payload)
        self.assertEqual(payload["token_type"], "bearer")


if __name__ == "__main__":
    unittest.main()
