import sys
import os
from datetime import datetime, timezone, timedelta

# Add server directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import SessionLocal, Base, engine
from app.models import User, Category, Article, Tag, Feedback, Media, SearchLog
from app.core.security import hash_password

def seed_database():
    print("Starting database seeding...")
    db = SessionLocal()

    try:
        # 1. Clean and sync database schema by recreating tables
        print("Recreating database tables to sync schema...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db.commit()

        # 2. Seed Users
        print("Seeding users...")
        users = [
            User(
                full_name="Dr. David Admin",
                email="admin@healthtech.com",
                hashed_password=hash_password("AdminPass123!"),
                role="admin",
                is_active=True,
                is_verified=True,
                total_queries=12,
                created_at=datetime.now(timezone.utc) - timedelta(days=30)
            ),
            User(
                full_name="Nurse Amina Editor",
                email="editor@healthtech.com",
                hashed_password=hash_password("EditorPass123!"),
                role="editor",
                is_active=True,
                is_verified=True,
                total_queries=5,
                created_at=datetime.now(timezone.utc) - timedelta(days=25)
            ),
            User(
                full_name="Grace Staff",
                email="staff@healthtech.com",
                hashed_password=hash_password("StaffPass123!"),
                role="staff",
                is_active=True,
                is_verified=True,
                total_queries=42,
                created_at=datetime.now(timezone.utc) - timedelta(days=20)
            )
        ]
        db.add_all(users)
        db.commit()
        
        # Refresh users to get IDs
        admin_user = db.query(User).filter(User.role == "admin").first()
        editor_user = db.query(User).filter(User.role == "editor").first()
        staff_user = db.query(User).filter(User.role == "staff").first()

        # 3. Seed Categories
        print("Seeding categories...")
        # Top-level Categories
        getting_started = Category(
            name="Getting Started",
            slug="getting-started",
            description="Onboarding, System Access, and navigation basics.",
            icon="home",
            sort_order=1
        )
        clinical_modules = Category(
            name="Clinical Modules",
            slug="clinical-modules",
            description="Workflows and user guides for clinical systems.",
            icon="activity",
            sort_order=2
        )
        troubleshooting = Category(
            name="Troubleshooting",
            slug="troubleshooting",
            description="Common error codes, bug resolutions, and system diagnostics.",
            icon="alert-circle",
            sort_order=3
        )
        db.add_all([getting_started, clinical_modules, troubleshooting])
        db.commit()

        # Subcategories
        login_access = Category(
            name="First Login & Access",
            slug="first-login-access",
            parent_id=getting_started.id,
            description="Setting up credentials and logging into the system.",
            icon="key",
            sort_order=1
        )
        lab_workflows = Category(
            name="Laboratory Workflows",
            slug="laboratory-workflows",
            parent_id=clinical_modules.id,
            description="Lab order entry, result validation, and printing.",
            icon="test-tube",
            sort_order=1
        )
        pharmacy_sop = Category(
            name="Pharmacy Dispensing",
            slug="pharmacy-dispensing",
            parent_id=clinical_modules.id,
            description="Drug inventory management and prescription fulfillment.",
            icon="package",
            sort_order=2
        )
        db.add_all([login_access, lab_workflows, pharmacy_sop])
        db.commit()

        # 4. Seed Tags
        print("Seeding tags...")
        tags = [
            Tag(name="onboarding", slug="onboarding"),
            Tag(name="patient", slug="patient"),
            Tag(name="pharmacy", slug="pharmacy"),
            Tag(name="error", slug="error"),
            Tag(name="lab", slug="lab")
        ]
        db.add_all(tags)
        db.commit()

        # Retrieve tags to link them
        onboarding_tag = db.query(Tag).filter(Tag.slug == "onboarding").first()
        patient_tag = db.query(Tag).filter(Tag.slug == "patient").first()
        pharmacy_tag = db.query(Tag).filter(Tag.slug == "pharmacy").first()
        error_tag = db.query(Tag).filter(Tag.slug == "error").first()
        lab_tag = db.query(Tag).filter(Tag.slug == "lab").first()

        # 5. Seed Articles
        print("Seeding articles...")
        articles = [
            Article(
                title="How to Reset a Patient Record",
                slug="how-to-reset-patient-record",
                content="""# How to Reset a Patient Record

This guide details the procedure for administrators or clinical leads to reset a patient record when data entry errors occur during registration.

## Prerequisites
- Authorized Admin or Clinical Supervisor role.
- Patient unique identifier (MRN).

## Step-by-Step Instructions
1. Navigate to **Patient Management** -> **Patient Registry**.
2. Search for the patient using the MRN.
3. Click on the **Edit Record** button at the top right of the profile.
4. Select **Reset Fields** from the options dropdown.
5. Provide a justification (this is logged in the audit trail).
6. Click **Confirm Reset**. The record status will revert to 'Draft'.

> [!WARNING]
> Resetting a record will lock clinical entries until re-verified. Make sure you have checked the spelling of patient identification documents.

## Contact Support
If you run into issues, please escalation path in the sidebar.""",
                category_id=getting_started.id,
                author_id=admin_user.id,
                status="published",
                tags="patient, onboarding",
                views=124,
                created_at=datetime.now(timezone.utc) - timedelta(days=10)
            ),
            Article(
                title="Pharmacy Dispensing SOP for High-Risk Meds",
                slug="pharmacy-dispensing-sop-high-risk",
                content="""# Pharmacy Dispensing SOP for High-Risk Medications

This Standard Operating Procedure (SOP) outlines the safety checks required before dispensing high-risk medications.

## Purpose
To ensure zero errors when distributing therapeutic agents categorized as high-alert (e.g., insulin, anticoagulants).

## Procedure Steps
1. **Verification**: Confirm prescription matching in the pharmacy module against patient clinical notes.
2. **Double Check**: A second licensed pharmacist must physically verify the dosage and drug name.
3. **Scan Barcode**: Scan the item's barcode in the HMIS interface. The system must prompt a green checkmark.
4. **Documentation**: Enter the verified staff member ID in the confirmation field.

## Exceptions
In emergency ward code-blue situations, verbal orders are permitted but must be logged within 2 hours of the event.

Review Date: 2026-12-31""",
                category_id=pharmacy_sop.id,
                author_id=editor_user.id,
                status="published",
                tags="pharmacy",
                views=45,
                created_at=datetime.now(timezone.utc) - timedelta(days=5)
            ),
            Article(
                title="FAQ: Accessing the Laboratory Module",
                slug="faq-accessing-laboratory-module",
                content="""# FAQ: Accessing the Laboratory Module

Frequently asked questions regarding lab logins, order visibility, and troubleshooting access permissions.

### Q: Why is my lab account showing 'Inactive'?
A: Your account requires role verification by your facility administrator. Contact IT access controllers.

### Q: How do I find orders placed from the outpatient ward?
A: Check the **Pending Outpatient queue** filter. Ensure the date range covers the current shift.

### Q: Can I edit results after verification?
A: No, once verified, results are pushed to the clinical dashboard and cannot be edited. A correction notice must be filed.""",
                category_id=lab_workflows.id,
                author_id=editor_user.id,
                status="published",
                tags="lab, onboarding",
                views=82,
                created_at=datetime.now(timezone.utc) - timedelta(days=8)
            ),
            Article(
                title="Resolving Database Connection Error 505",
                slug="resolving-database-connection-error-505",
                content="""# Resolving Database Connection Error 505

This guide details steps to troubleshoot and resolve 'Error 505: DB Pool Connection Timeout' when accessing the HMIS database from facility terminals.

## Symptoms
- Screen freeze on login.
- Error prompt stating: `Could not retrieve user roles - Timeout`.

## Diagnostic Steps
1. **Check local ping**: Open terminal and verify ping to server host:
   `ping database.local`
2. **Review Connection Pools**: Ensure active connections do not exceed the pool limit.
3. **Restart Service**: Restart the local client gateway daemon:
   `sudo systemctl restart hmis-gateway`

If the error persists, check whether there's a running network switch backup process saturating the bandwidth.""",
                category_id=troubleshooting.id,
                author_id=admin_user.id,
                status="published",
                tags="error",
                views=18,
                created_at=datetime.now(timezone.utc) - timedelta(days=3)
            ),
            Article(
                title="SOP: Administering Pediatric Doses",
                slug="sop-administering-pediatric-doses",
                content="""# SOP: Administering Pediatric Doses (Draft)

This document is under review and is not yet approved for clinical use.

## Guidelines
- Always verify patient age and weight prior to dose calculation.
- Double-check pediatric calculations against the body surface area formula.""",
                category_id=clinical_modules.id,
                author_id=editor_user.id,
                status="draft",
                tags="patient",
                views=0,
                created_at=datetime.now(timezone.utc) - timedelta(days=1)
            )
        ]
        
        # Link tags many-to-many
        articles[0].tags_rel.append(patient_tag)
        articles[0].tags_rel.append(onboarding_tag)
        articles[1].tags_rel.append(pharmacy_tag)
        articles[2].tags_rel.append(lab_tag)
        articles[2].tags_rel.append(onboarding_tag)
        articles[3].tags_rel.append(error_tag)
        articles[4].tags_rel.append(patient_tag)

        db.add_all(articles)
        db.commit()

        # Retrieve articles for feedback seeding
        db_articles = db.query(Article).all()
        article_reset = next(a for a in db_articles if a.slug == "how-to-reset-patient-record")
        article_pharmacy = next(a for a in db_articles if a.slug == "pharmacy-dispensing-sop-high-risk")

        # 6. Seed Feedback
        print("Seeding feedback...")
        feedbacks = [
            Feedback(
                article_id=article_reset.id,
                user_id=staff_user.id,
                rating=5,
                comment="Extremely clear and easy to follow! Saved a lot of time on my shift.",
                created_at=datetime.now(timezone.utc) - timedelta(days=2)
            ),
            Feedback(
                article_id=article_pharmacy.id,
                user_id=staff_user.id,
                rating=4,
                comment="Very helpful guide. It would be great to add screenshots of the barcode popup.",
                created_at=datetime.now(timezone.utc) - timedelta(days=1)
            )
        ]
        db.add_all(feedbacks)
        db.commit()

        # 7. Seed Search Logs
        print("Seeding search logs...")
        search_logs = [
            SearchLog(query="reset patient record", results_count=1, user_id=staff_user.id, created_at=datetime.now(timezone.utc) - timedelta(hours=5)),
            SearchLog(query="pharmacy dispensing", results_count=1, user_id=staff_user.id, created_at=datetime.now(timezone.utc) - timedelta(hours=4)),
            SearchLog(query="database error 505", results_count=1, user_id=staff_user.id, created_at=datetime.now(timezone.utc) - timedelta(hours=3)),
            SearchLog(query="invalid laboratory query", results_count=0, user_id=staff_user.id, created_at=datetime.now(timezone.utc) - timedelta(hours=2))
        ]
        db.add_all(search_logs)
        db.commit()

        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
