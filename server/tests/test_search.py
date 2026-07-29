import sys
import unittest
from pathlib import Path

from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import Base, engine
from app.models import Article, Category
from app.services.kb_search import compose_reply, extract_keywords, extract_snippet, search_articles


class KBSearchUnitTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        with Session(engine) as session:
            cat = Category(name="EHR", slug="ehr")
            session.add(cat)
            session.commit()

            art1 = Article(
                title="Prescription Workflow",
                slug="prescription-workflow",
                content="To create a new electronic prescription, navigate to Patients > Prescriptions.",
                category_id=cat.id,
                status="published",
            )
            art2 = Article(
                title="Lab Results Entry",
                slug="lab-results-entry",
                content="Lab technicians can enter blood work results directly from the laboratory dashboard.",
                category_id=cat.id,
                status="published",
            )
            session.add_all([art1, art2])
            session.commit()

    def tearDown(self):
        Base.metadata.drop_all(bind=engine)
        engine.dispose()

    def test_extract_keywords_removes_stopwords(self):
        keywords = extract_keywords("how do I create a new prescription?")
        self.assertIn("prescription", keywords)
        self.assertNotIn("how", keywords)
        self.assertNotIn("the", keywords)

    def test_extract_snippet_centers_match(self):
        content = "Line one here. Electronic prescription details are located here."
        snippet = extract_snippet(content, ["prescription"])
        self.assertIn("prescription", snippet.lower())

    def test_compose_reply_returns_matched_article(self):
        with Session(engine) as session:
            reply = compose_reply(session, "prescription workflow")
            self.assertIn('From "Prescription Workflow"', reply)
            self.assertIn("electronic prescription", reply)


if __name__ == "__main__":
    unittest.main()
