"""
seed_hmis_articles.py

Adds 10 realistic HMIS knowledge-base articles, written in the project's
own words but grounded in real terminology from an actual HMIS user guide
(patient registration flow, OTP verification, triage, lab order queue
states, pharmacy dispensation queue, referral workflow, ANC, EPI, etc.).

Run standalone AFTER seed_db.py (needs categories/tags/users to already
exist). Does not wipe existing data -- only inserts these 10 articles if
they don't already exist (matched by slug), so it's safe to re-run.

Usage:
    python seed_hmis_articles.py
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models import User, Category, Article, Tag

ARTICLES = [
    {
        "title": "SOP: Patient Registration",
        "slug": "sop-patient-registration",
        "category_slug": "getting-started",
        "tags": ["registration", "how-to"],
        "content": """<h2>Purpose</h2>
<p>Defines the standard steps for registering a new or returning patient in the HMIS before any clinical service can begin.</p>

<h2>Scope / Who</h2>
<p>Applies to doctors, clinical officers, nurses, health records officers, and data clerks at facility reception or registration desks.</p>

<h2>Procedure</h2>
<ol>
<li>Sign in with your username and password, then verify the one-time password (OTP) sent to your registered phone. If the OTP does not arrive within 30 seconds, use <strong>Resend</strong>.</li>
<li>From the facility dashboard, open the <strong>Registration</strong> module.</li>
<li>Select the patient's ID type &mdash; National ID, Foreign ID, Temporary ID, Birth Certificate, Refugee ID, or Alien ID &mdash; and enter the ID number, then click <strong>Search</strong>.</li>
<li>Confirm the correct patient (or dependent) from the results using the radio button, then click <strong>Confirm</strong>.</li>
<li>Proceed to send an OTP to the patient's own phone number for identity verification, then enter it and click <strong>Verify</strong>.</li>
<li>On the Patient Biodata page, select the patient's covered scheme, then route them onward: <strong>Book Appointment</strong> for a future visit, <strong>Walk-in Orders</strong> for an immediate lab/procedure/radiology order, <strong>Send to Triage</strong>, or <strong>Send to Consultation</strong>.</li>
</ol>

<h2>Notes / Edge Cases</h2>
<ul>
<li>If the patient has no ID document available, use Temporary ID and update the record once proper documentation is provided.</li>
<li>Registration cannot be completed without a successful OTP verification of the patient's own number, since this confirms consent and identity.</li>
</ul>""",
    },
    {
        "title": "How to Schedule an Appointment",
        "slug": "how-to-schedule-appointment",
        "category_slug": "getting-started",
        "tags": ["appointments", "how-to"],
        "content": """<h2>Overview</h2>
<p>This guide walks through booking a patient appointment for a future visit date.</p>

<h2>Prerequisites</h2>
<ul>
<li>An active HMIS login</li>
<li>The patient must already be registered in the system</li>
</ul>

<h2>Steps</h2>
<ol>
<li>Sign in and verify your OTP as usual.</li>
<li>Search for the patient using their ID number, the same way as in registration.</li>
<li>Once the patient is confirmed, select <strong>Book Appointment</strong> from the Patient Biodata page.</li>
<li>Choose the appointment date, time, and relevant clinic or provider.</li>
<li>Confirm the booking. The patient will appear in that clinic's appointment list for the selected date.</li>
</ol>

<h2>Troubleshooting</h2>
<p>If the patient does not appear when searched, confirm they are registered first &mdash; appointments cannot be booked for unregistered patients.</p>

<h2>Related Articles</h2>
<p>SOP: Patient Registration, Referral Workflow</p>""",
    },
    {
        "title": "How to Record Patient Vitals",
        "slug": "how-to-record-vitals",
        "category_slug": "clinical-modules",
        "tags": ["vitals", "how-to"],
        "content": """<h2>Overview</h2>
<p>Recording vitals is typically the first clinical step after a patient is sent to Triage from registration.</p>

<h2>Prerequisites</h2>
<ul>
<li>Patient must have completed registration and been sent to Triage</li>
</ul>

<h2>Steps</h2>
<ol>
<li>From the Triage queue, locate the patient by name.</li>
<li>Open their record and enter the vital signs requested (e.g. temperature, blood pressure, weight, height, pulse).</li>
<li>Save the vitals capture. The patient's status updates and they become available for the next step in their care pathway, typically Consultation.</li>
</ol>

<h2>Troubleshooting</h2>
<p>If a patient does not appear in the Triage queue, confirm that reception routed them to Triage (rather than directly to Consultation) during registration.</p>""",
    },
    {
        "title": "SOP: Consultation Workflow",
        "slug": "sop-consultation-workflow",
        "category_slug": "clinical-modules",
        "tags": ["consultation", "how-to"],
        "content": """<h2>Purpose</h2>
<p>Standardizes how a clinician conducts and documents a consultation once a patient reaches the Consultation Room.</p>

<h2>Scope / Who</h2>
<p>Doctors, clinical officers, and nurses conducting patient consultations.</p>

<h2>Procedure</h2>
<ol>
<li>Open the patient's record from the Consultation queue.</li>
<li>Review any vitals already captured at Triage.</li>
<li>Document presenting complaint, examination findings, and diagnosis.</li>
<li>Where required, initiate orders directly from the consultation screen &mdash; lab orders, procedure orders, or a pharmacy prescription.</li>
<li>Complete the consultation record to close out the visit or route the patient onward (e.g. to Lab, Pharmacy, or Admission).</li>
</ol>

<h2>Notes / Edge Cases</h2>
<p>Consultation notes should be finalized before routing the patient onward &mdash; incomplete notes make it harder for downstream staff (lab, pharmacy) to understand the clinical context of an order.</p>""",
    },
    {
        "title": "SOP: Lab Order Processing",
        "slug": "sop-lab-order-processing",
        "category_slug": "clinical-modules",
        "tags": ["lab", "how-to"],
        "content": """<h2>Purpose</h2>
<p>Describes how lab staff process an order from request through result posting.</p>

<h2>Scope / Who</h2>
<p>Doctors, clinical officers, nurses, and laboratory staff.</p>

<h2>Procedure</h2>
<ol>
<li>Open the <strong>Labs</strong> module from the main menu. Orders are organized into queue states: Awaiting Sampling, Processing, Awaiting Verification, Posted, Tests Ordered, Long Turnaround, and Referrals.</li>
<li>The <strong>Awaiting Sampling</strong> tab is selected by default and lists patients with pending lab orders. Use the date filter to narrow the list to a specific range.</li>
<li>Locate the patient (by name or search), and confirm the order status &mdash; for example, "Awaiting Payment" &mdash; along with the requested test and its priority level.</li>
<li>Click <strong>View</strong> to open the order details, collect the sample, and move the order through Processing, Verification, and finally Posted once results are ready.</li>
</ol>

<h2>Notes / Edge Cases</h2>
<p>Orders flagged as "Long Turnaround" (e.g. send-out tests) follow the same queue states but on a longer timeline &mdash; don't treat a delay in this category as an error.</p>""",
    },
    {
        "title": "SOP: Pharmacy Dispensing",
        "slug": "sop-pharmacy-dispensing",
        "category_slug": "clinical-modules",
        "tags": ["pharmacy", "how-to"],
        "content": """<h2>Purpose</h2>
<p>Defines the dispensation workflow for prescriptions issued during a consultation.</p>

<h2>Scope / Who</h2>
<p>Doctors, clinical officers, nurses, and pharmacists.</p>

<h2>Procedure</h2>
<ol>
<li>Open the <strong>Pharmacy</strong> module to view the dispensing queue, listing patients awaiting dispensation. Use date filters or the search bar (by patient name or ticket number) to narrow the queue.</li>
<li>Locate the patient &mdash; their request status will show as "Awaiting Dispensation," meaning the prescription is pending fulfillment.</li>
<li>Click on the patient or ticket number to open and verify the full prescription details before dispensing.</li>
<li>Confirm dispensation once medication has been provided, updating the patient's status in the queue.</li>
</ol>

<h2>Notes / Edge Cases</h2>
<p>Always verify prescription details against the consultation notes before dispensing, particularly for high-risk medications.</p>""",
    },
    {
        "title": "SOP: Admission Process",
        "slug": "sop-admission-process",
        "category_slug": "clinical-modules",
        "tags": ["admission", "how-to"],
        "content": """<h2>Purpose</h2>
<p>Describes the process for admitting a patient for inpatient or maternity care.</p>

<h2>Scope / Who</h2>
<p>Doctors, clinical officers, and nursing staff involved in inpatient admission.</p>

<h2>Procedure</h2>
<ol>
<li>From the patient's consultation record, initiate an admission when inpatient care is clinically indicated.</li>
<li>Complete the admission form, capturing ward/bed assignment and admitting diagnosis.</li>
<li>For maternity admissions, follow the maternity-specific admission fields (expected delivery date, gravida/para status where applicable).</li>
<li>Confirm the admission to move the patient into the inpatient record system for ongoing care documentation.</li>
</ol>

<h2>Notes / Edge Cases</h2>
<p>Bed/ward availability should be confirmed before completing the admission to avoid conflicting assignments.</p>""",
    },
    {
        "title": "SOP: Referral Workflow",
        "slug": "sop-referral-workflow",
        "category_slug": "clinical-modules",
        "tags": ["referral", "how-to"],
        "content": """<h2>Purpose</h2>
<p>Standardizes how a patient is referred to another facility or department for care not available on-site.</p>

<h2>Scope / Who</h2>
<p>Doctors, clinical officers, nurses, and health records staff.</p>

<h2>Procedure</h2>
<ol>
<li>From the patient's record, initiate a referral once the need is clinically confirmed.</li>
<li>Specify the referral reason, the receiving facility or department, and any accompanying clinical notes.</li>
<li>Confirm the referral to generate the referral record, which the patient or receiving facility can reference.</li>
</ol>

<h2>Notes / Edge Cases</h2>
<p>A referral does not close the patient's local record &mdash; it should still be updated with outcome notes if the patient returns for follow-up.</p>

<h2>Related Articles</h2>
<p>SOP: Consultation Workflow, SOP: Lab Order Processing</p>""",
    },
    {
        "title": "How to Record an ANC Visit",
        "slug": "how-to-record-anc-visit",
        "category_slug": "clinical-modules",
        "tags": ["anc", "how-to"],
        "content": """<h2>Overview</h2>
<p>Antenatal Care (ANC) visits are recorded to track a pregnancy through scheduled check-ins.</p>

<h2>Prerequisites</h2>
<ul>
<li>Patient must be registered and have an active ANC record, or be newly enrolled into ANC at this visit</li>
</ul>

<h2>Steps</h2>
<ol>
<li>Open the patient's record and select the ANC module.</li>
<li>If this is the patient's first ANC visit, complete the initial enrollment fields (gestational age, expected delivery date, obstetric history).</li>
<li>For follow-up visits, record the current visit's findings (vitals, fetal assessment, any flagged risks).</li>
<li>Save the visit to update the patient's ANC visit history and schedule the next recommended visit if applicable.</li>
</ol>

<h2>Troubleshooting</h2>
<p>If prior ANC history doesn't appear, confirm the patient's record wasn't duplicated during registration &mdash; search by ID number rather than name to avoid this.</p>""",
    },
    {
        "title": "How to Record an Immunization (EPI)",
        "slug": "how-to-record-epi-immunization",
        "category_slug": "clinical-modules",
        "tags": ["epi", "how-to"],
        "content": """<h2>Overview</h2>
<p>The Expanded Programme on Immunization (EPI) module is used to record vaccinations administered to a patient.</p>

<h2>Prerequisites</h2>
<ul>
<li>Patient must be registered in the system</li>
</ul>

<h2>Steps</h2>
<ol>
<li>Open the patient's record and select the EPI module.</li>
<li>Select the vaccine administered and confirm the dose number in the schedule.</li>
<li>Record the date administered and any batch/lot details required by facility policy.</li>
<li>Save the entry to update the patient's immunization history and, where applicable, the schedule for their next due vaccine.</li>
</ol>

<h2>Troubleshooting</h2>
<p>If a vaccine dose appears out of sequence, confirm the patient's prior doses were recorded correctly rather than skipped in the system.</p>""",
    },
]


def get_or_create_tag(db, name):
    tag = db.query(Tag).filter(Tag.name == name).first()
    if tag:
        return tag
    slug = name.lower().replace(" ", "-")
    tag = Tag(name=name, slug=slug)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def seed_hmis_articles():
    print("Seeding HMIS knowledge base articles...")
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        editor = db.query(User).filter(User.role == "editor").first()
        author = editor or admin
        if not author:
            print("No admin/editor user found -- run seed_db.py first.")
            sys.exit(1)

        categories = {c.slug: c for c in db.query(Category).all()}

        created = 0
        skipped = 0
        for i, item in enumerate(ARTICLES):
            existing = db.query(Article).filter(Article.slug == item["slug"]).first()
            if existing:
                skipped += 1
                continue

            category = categories.get(item["category_slug"])
            if not category:
                print(
                    f"  Skipping '{item['title']}' -- category '{item['category_slug']}' not found"
                )
                continue

            article = Article(
                title=item["title"],
                slug=item["slug"],
                content=item["content"],
                category_id=category.id,
                author_id=author.id,
                status="published",
                views=0,
                created_at=datetime.now(timezone.utc)
                - timedelta(days=len(ARTICLES) - i),
            )
            article.tags_rel = [get_or_create_tag(db, t) for t in item["tags"]]
            db.add(article)
            db.commit()
            created += 1
            print(f"  Created: {item['title']}")

        print(f"Done. Created {created} articles, skipped {skipped} already-existing.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding HMIS articles: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_hmis_articles()
