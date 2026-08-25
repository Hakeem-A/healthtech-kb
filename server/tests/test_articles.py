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

    def test_editor_creation_automatically_sets_under_review(self):
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
        self.assertEqual(data["status"], "under_review")

    def test_admin_cannot_create_article(self):
        res = self.client.post(
            "/api/v1/articles/",
            json={
                "title": "Admin Created Guide",
                "content": "Admin content.",
                "category_id": self.cat_id,
                "status": "draft",
            },
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Admins cannot create articles", res.json()["detail"])

    def test_admin_can_approve_reject_and_delete_article(self):
        # 1. Editor creates article (under_review)
        res_create = self.client.post(
            "/api/v1/articles/",
            json={
                "title": "Reviewable Guide",
                "content": "Reviewable content.",
                "category_id": self.cat_id,
            },
            headers={"Authorization": f"Bearer {self.editor_token}"},
        )
        self.assertEqual(res_create.status_code, 201)
        article_id = res_create.json()["id"]
        self.assertEqual(res_create.json()["status"], "under_review")

        # 2. Admin rejects with reason
        res_reject = self.client.put(
            f"/api/v1/articles/{article_id}/reject",
            json={"reason": "Missing clinical protocol reference."},
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res_reject.status_code, 200)
        self.assertEqual(res_reject.json()["status"], "draft")
        self.assertEqual(
            res_reject.json()["rejection_reason"],
            "Missing clinical protocol reference.",
        )

        # 3. Editor updates and resubmits (status -> under_review)
        res_resubmit = self.client.put(
            f"/api/v1/articles/{article_id}",
            json={
                "content": "Updated content with protocol reference.",
                "status": "under_review",
            },
            headers={"Authorization": f"Bearer {self.editor_token}"},
        )
        self.assertEqual(res_resubmit.status_code, 200)
        self.assertEqual(res_resubmit.json()["status"], "under_review")

        # 4. Admin approves
        res_approve = self.client.put(
            f"/api/v1/articles/{article_id}/approve",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res_approve.status_code, 200)
        self.assertEqual(res_approve.json()["status"], "published")

        # 5. Admin deletes
        res_del = self.client.delete(
            f"/api/v1/articles/{article_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res_del.status_code, 204)

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

    def test_get_low_rated_articles(self):
        from app.models.feedback import Feedback

        with TestingSessionLocal() as session:
            art_low = Article(
                title="Low Rated Article",
                slug="low-rated-article",
                content="Needs improvement",
                category_id=self.cat_id,
                author_id=self.editor_id,
                status="published",
            )
            art_high = Article(
                title="High Rated Article",
                slug="high-rated-article",
                content="Excellent article",
                category_id=self.cat_id,
                author_id=self.editor_id,
                status="published",
            )
            session.add_all([art_low, art_high])
            session.commit()

            fb1 = Feedback(
                article_id=art_low.id,
                user_id=self.viewer_id,
                rating=2,
                comment="Unclear instructions in section 2",
            )
            fb2 = Feedback(
                article_id=art_low.id,
                user_id=self.admin_id,
                rating=1,
                comment="Outdated protocol",
            )
            fb3 = Feedback(
                article_id=art_high.id,
                user_id=self.viewer_id,
                rating=5,
                comment="Very clear and helpful",
            )
            session.add_all([fb1, fb2, fb3])
            session.commit()

        # Editor access
        res = self.client.get(
            "/api/v1/articles/low-rated?max_rating=3.0",
            headers={"Authorization": f"Bearer {self.editor_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Low Rated Article")
        self.assertEqual(data[0]["average_rating"], 1.5)
        self.assertEqual(data[0]["rating_count"], 2)
        self.assertEqual(len(data[0]["recent_feedback"]), 2)

        # Viewer should be forbidden (403)
        res_viewer = self.client.get(
            "/api/v1/articles/low-rated",
            headers={"Authorization": f"Bearer {self.viewer_token}"},
        )
        self.assertEqual(res_viewer.status_code, 403)


if __name__ == "__main__":
    unittest.main()
