import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

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


class ArticleEndpointTests(unittest.TestCase):
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
            self.admin = User(
                full_name="Admin User",
                email="admin@test.com",
                hashed_password=hash_password("admin123"),
                role="admin",
                is_active=True,
            )
            self.editor = User(
                full_name="Editor User",
                email="editor@test.com",
                hashed_password=hash_password("editor123"),
                role="editor",
                is_active=True,
            )
            self.viewer = User(
                full_name="Viewer User",
                email="viewer@test.com",
                hashed_password=hash_password("viewer123"),
                role="viewer",
                is_active=True,
            )
            session.add_all([self.admin, self.editor, self.viewer])

            self.category = Category(name="General", slug="general")
            session.add(self.category)
            session.commit()

            self.admin_id = self.admin.id
            self.editor_id = self.editor.id
            self.viewer_id = self.viewer.id
            self.cat_id = self.category.id

        self.admin_token = create_access_token(
            {"sub": "admin@test.com", "role": "admin"}
        )
        self.editor_token = create_access_token(
            {"sub": "editor@test.com", "role": "editor"}
        )
        self.viewer_token = create_access_token(
            {"sub": "viewer@test.com", "role": "viewer"}
        )

    def tearDown(self):
        Base.metadata.drop_all(bind=test_engine)
        app.dependency_overrides.clear()

    def test_editor_can_create_draft_article(self):
        res = self.client.post(
            "/api/v1/articles/",
            json={
                "title": "Patient Onboarding Guide",
                "content": "Step 1: Check in patient at front desk.",
                "category_id": self.cat_id,
                "status": "draft",
            },
            headers={"Authorization": f"Bearer {self.editor_token}"},
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["title"], "Patient Onboarding Guide")
        self.assertEqual(data["slug"], "patient-onboarding-guide")
        self.assertEqual(data["status"], "draft")

    def test_viewer_cannot_create_article(self):
        res = self.client.post(
            "/api/v1/articles/",
            json={
                "title": "Unauthorized Article",
                "content": "Viewer trying to create.",
                "category_id": self.cat_id,
                "status": "draft",
            },
            headers={"Authorization": f"Bearer {self.viewer_token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_viewer_only_sees_published_articles(self):
        with TestingSessionLocal() as session:
            pub = Article(
                title="Published Article",
                slug="published-article",
                content="Public info",
                category_id=self.cat_id,
                author_id=self.editor_id,
                status="published",
            )
            draft = Article(
                title="Draft Article",
                slug="draft-article",
                content="Draft info",
                category_id=self.cat_id,
                author_id=self.editor_id,
                status="draft",
            )
            session.add_all([pub, draft])
            session.commit()

        res_viewer = self.client.get(
            "/api/v1/articles/",
            headers={"Authorization": f"Bearer {self.viewer_token}"},
        )
        self.assertEqual(res_viewer.status_code, 200)
        articles_viewer = res_viewer.json()
        self.assertEqual(len(articles_viewer), 1)
        self.assertEqual(articles_viewer[0]["title"], "Published Article")

        res_editor = self.client.get(
            "/api/v1/articles/",
            headers={"Authorization": f"Bearer {self.editor_token}"},
        )
        self.assertEqual(res_editor.status_code, 200)
        self.assertEqual(len(res_editor.json()), 2)


if __name__ == "__main__":
    unittest.main()
