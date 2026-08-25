import sys
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

# Add server directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models import User, Category, Article, Tag, Feedback, Media, SearchLog
from app.core.security import hash_password


HMIS_ARTICLES = [
    {
        "title": "SOP: Patient Registration & Identity Verification",
        "slug": "sop-patient-registration",
        "category_slug": "getting-started",
        "tags": ["registration", "how-to", "onboarding"],
        "status": "published",
        "views": 245,
        "days_ago": 25,
        "content": """<h2>1. Purpose & Clinical Scope</h2>
<p>This Standard Operating Procedure (SOP) standardizes the intake and biometric/OTP identity verification protocol for all patients presenting at the outpatient department (OPD), emergency room (ER), or specialized clinical units.</p>

<h2>2. Applicable Personnel</h2>
<p>Applies to front-desk health records officers (HROs), admissions clerks, triage nurses, and medical officers on duty.</p>

<h2>3. Required Equipment & Prerequisites</h2>
<ul>
  <li>Active HMIS credentials with <strong>FrontDesk / Records</strong> privileges.</li>
  <li>Connected barcode/ID document scanner and SMS gateway access.</li>
  <li>Valid patient identification document (National ID, Passport, Refugee Alien ID, or Birth Certificate).</li>
</ul>

<h2>4. Step-by-Step Intake Procedure</h2>
<ol>
  <li><strong>Authentication:</strong> Sign into the HMIS portal and confirm two-factor OTP authentication.</li>
  <li><strong>Patient Search:</strong> Select the <em>Registration & Records</em> module. Enter the patient's primary ID number or national health identifier.
    <ul>
      <li><em>Returning Patient:</em> Confirm demographic details, active insurance policies, and current contact numbers.</li>
      <li><em>New Patient:</em> Select <strong>Register New Patient</strong> and capture primary biodata (Full Name, DOB, Gender, Next of Kin, Primary Phone Number).</li>
    </ul>
  </li>
  <li><strong>OTP Consent & Verification:</strong> Click <strong>Send Verification OTP</strong> to the patient's registered mobile number. Enter the received 6-digit code to validate patient consent and identity.</li>
  <li><strong>Coverage & Scheme Allocation:</strong> Select the appropriate financing mechanism (National Insurance Scheme, Private Corporate Cover, or Cash/Out-of-Pocket).</li>
  <li><strong>Clinical Queue Routing:</strong> Route the patient based on initial presentation:
    <ul>
      <li><strong>Send to Triage:</strong> Routine walk-ins and general consultations.</li>
      <li><strong>Send to Emergency / Resuscitation:</strong> Urgent, unstable, or acute trauma cases.</li>
      <li><strong>Direct Clinic Appointment:</strong> Scheduled specialized review (e.g. Oncology, Dental, ANC).</li>
    </ul>
  </li>
</ol>

<blockquote>
  <strong>⚠️ Clinical Safety Warning:</strong> In unconscious or unidentified emergency admissions, register the patient under an emergency <code>TMP-EMERGENCY-[TIMESTAMP]</code> identifier and execute immediate clinical intake without delaying triage.
</blockquote>

<h2>5. Special Considerations & Edge Cases</h2>
<ul>
  <li><strong>Minors (<18 years):</strong> Must be linked to a primary guardian record with guardian National ID verification.</li>
  <li><strong>System Offline Protocol:</strong> Utilize physical triaged intake paper registers and synchronize entries into HMIS within 2 hours of network restoration.</li>
</ul>""",
    },
    {
        "title": "How to Schedule & Manage Outpatient Appointments",
        "slug": "how-to-schedule-appointment",
        "category_slug": "getting-started",
        "tags": ["appointments", "how-to", "records"],
        "status": "published",
        "views": 182,
        "days_ago": 22,
        "content": """<h2>1. Overview</h2>
<p>This protocol details the scheduling, rescheduling, and cancellation workflows for outpatient clinic appointments across specialized departments (Surgical, Medical, Pediatrics, Obstetrics, and Mental Health).</p>

<h2>2. Scheduling Workflow</h2>
<ol>
  <li>Open the <strong>Clinic Calendar</strong> module from the left navigation panel.</li>
  <li>Filter by <strong>Department</strong> (e.g., Cardiology Outpatient) and select the designated consulting physician.</li>
  <li>Locate an available time slot and click <strong>Book Slot</strong>.</li>
  <li>Search for the patient record via National ID or HMIS Master Patient Index (MPI) number.</li>
  <li>Specify the appointment type: <em>Initial Consultation</em>, <em>Post-Operative Follow-Up</em>, or <em>Chronic Disease Review</em>.</li>
  <li>Click <strong>Confirm Booking</strong>. The system will automatically dispatch an SMS reminder notification to the patient with clinic location and visit instructions.</li>
</ol>

<h2>3. Clinic Capacity & Double-Booking Rules</h2>
<ul>
  <li>Standard consultation slots are allocated at <strong>15-minute intervals</strong>.</li>
  <li>Physician overbooking requires explicit clinical lead authorization in the scheduling interface.</li>
</ul>""",
    },
    {
        "title": "SOP: Triage & Vital Signs Recording",
        "slug": "how-to-record-vitals",
        "category_slug": "clinical-modules",
        "tags": ["vitals", "how-to", "triage"],
        "status": "published",
        "views": 310,
        "days_ago": 20,
        "content": """<h2>1. Purpose</h2>
<p>Establishes standard clinical guidelines for measuring, documenting, and interpreting baseline vital signs to prioritize care acuity using the Modified Early Warning Score (MEWS).</p>

<h2>2. Parameters & Normal Clinical Ranges</h2>
<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Adult Range</th>
      <th>Critical Threshold Alert</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Blood Pressure (Systolic)</strong></td>
      <td>100 - 139 mmHg</td>
      <td>&lt; 90 or &gt; 180 mmHg</td>
    </tr>
    <tr>
      <td><strong>Heart Rate (Pulse)</strong></td>
      <td>60 - 100 bpm</td>
      <td>&lt; 45 or &gt; 130 bpm</td>
    </tr>
    <tr>
      <td><strong>Respiratory Rate</strong></td>
      <td>12 - 20 bpm</td>
      <td>&lt; 8 or &gt; 28 bpm</td>
    </tr>
    <tr>
      <td><strong>Oxygen Saturation (SpO2)</strong></td>
      <td>95% - 100%</td>
      <td>&lt; 92% (on room air)</td>
    </tr>
    <tr>
      <td><strong>Temperature</strong></td>
      <td>36.5°C - 37.5°C</td>
      <td>&gt; 38.5°C or &lt; 35.5°C</td>
    </tr>
  </tbody>
</table>

<h2>3. Recording Procedure in HMIS</h2>
<ol>
  <li>Access the <strong>Triage Queue</strong> and select the arriving patient.</li>
  <li>Calibrate automated non-invasive blood pressure (NIBP) cuffs and pulse oximeter probes.</li>
  <li>Enter measured vitals directly into the numeric entry fields. The HMIS automatically calculates the MEWS score and Body Mass Index (BMI).</li>
  <li>Assign the Manchester / South African Triage category:
    <ul>
      <li><strong style="color: #dc2626;">Red (Resuscitation):</strong> Immediate physician response required.</li>
      <li><strong style="color: #ea580c;">Orange (Very Urgent):</strong> Target review within 10 minutes.</li>
      <li><strong style="color: #ca8a04;">Yellow (Urgent):</strong> Target review within 60 minutes.</li>
      <li><strong style="color: #16a34a;">Green (Non-Urgent):</strong> Standard OPD queue.</li>
    </ul>
  </li>
  <li>Click <strong>Save & Transfer to Consultation</strong>.</li>
</ol>""",
    },
    {
        "title": "SOP: Clinical Consultation & Electronic Prescribing",
        "slug": "sop-consultation-workflow",
        "category_slug": "clinical-modules",
        "tags": ["consultation", "how-to", "clinical"],
        "status": "published",
        "views": 380,
        "days_ago": 18,
        "content": """<h2>1. Clinical Objectives</h2>
<p>Standardizes the physician and clinical officer workflow for outpatient consultations, clinical documentation, diagnostic workups, and electronic prescription (e-Rx) authoring.</p>

<h2>2. Consultation Flow</h2>
<ol>
  <li><strong>Patient File Retrieval:</strong> Select the assigned patient from your active <em>Consultation Room Queue</em>.</li>
  <li><strong>History & Examination:</strong>
    <ul>
      <li>Document History of Presenting Illness (HPI), past medical/surgical history, and known drug allergies.</li>
      <li>Review vital trends captured at triage.</li>
      <li>Record physical examination findings by anatomical system.</li>
    </ul>
  </li>
  <li><strong>Diagnostic Formulation:</strong> Select ICD-11 primary and secondary diagnoses using the integrated autocomplete search.</li>
  <li><strong>Investigation Orders:</strong>
    <ul>
      <li><em>Lab Orders:</em> Select standardized test panels (e.g., Complete Blood Count, Renal Function Tests).</li>
      <li><em>Radiology Orders:</em> Specify imaging modality (X-ray, Ultrasound, CT) and clinical indication.</li>
    </ul>
  </li>
  <li><strong>Electronic Prescription (e-Rx):</strong>
    <ul>
      <li>Search active hospital formulary by generic international nonproprietary name (INN).</li>
      <li>Specify dosage, route, frequency (e.g., TDS, BD), and duration in days.</li>
      <li>Review automated allergy contraindication and drug-drug interaction alerts.</li>
    </ul>
  </li>
  <li><strong>Disposition & Sign-Off:</strong> Select patient disposition (<em>Discharge with Medication</em>, <em>Direct Ward Admission</em>, or <em>Schedule Follow-Up</em>) and electronically sign the encounter.</li>
</ol>""",
    },
    {
        "title": "SOP: Laboratory Order Processing & Results Validation",
        "slug": "sop-lab-order-processing",
        "category_slug": "laboratory-workflows",
        "tags": ["lab", "how-to", "diagnostics"],
        "status": "published",
        "views": 290,
        "days_ago": 16,
        "content": """<h2>1. Purpose</h2>
<p>Outlines the end-to-end lifecycle of diagnostic laboratory orders from phlebotomy and specimen accessioning to automated analyzer result verification and clinical sign-off.</p>

<h2>2. Laboratory Queue Lifecycle States</h2>
<ol>
  <li><strong>Awaiting Sampling:</strong> Patient presents at lab reception. Verify patient identity via barcode wristband or OTP. Collect required specimen tubes (EDTA, Serum Gel, Citrate).</li>
  <li><strong>Accessioning & Barcode Labeling:</strong> Affix thermal barcode labels matching the HMIS Lab Requisition Number to each specimen container.</li>
  <li><strong>Processing:</strong> Specimen loaded into clinical chemistry/hematology analyzer or plated for microbiology culture.</li>
  <li><strong>Awaiting Verification:</strong> Analyzer transmits raw quantitative values via HL7/LIS interface. Medical Laboratory Technologist audits values against reference intervals and Delta checks.</li>
  <li><strong>Posted & Published:</strong> Results validated by the Senior Laboratory Technologist; immediately visible in the clinician's consultation portal.</li>
</ol>

<blockquote>
  <strong>🚨 Critical Value Notification:</strong> Any panic/critical result (e.g. Potassium &lt; 2.5 or &gt; 6.5 mmol/L, Platelets &lt; 20,000/µL) requires mandatory immediate telephone notification to the ordering clinician and documentation in the Critical Alert Log.
</blockquote>""",
    },
    {
        "title": "SOP: Pharmacy Prescription Dispensing & Drug Safety",
        "slug": "sop-pharmacy-dispensing",
        "category_slug": "pharmacy-dispensing",
        "tags": ["pharmacy", "how-to", "safety"],
        "status": "published",
        "views": 275,
        "days_ago": 15,
        "content": """<h2>1. Purpose</h2>
<p>Ensures adherence to the <strong>Five Rights of Medication Administration</strong> (Right Patient, Right Drug, Right Dose, Right Route, Right Time) and governs controlled drug inventory management.</p>

<h2>2. Dispensing Protocol</h2>
<ol>
  <li>Open the <strong>Pharmacy Dispensing Queue</strong>. Select the patient ticket number.</li>
  <li><strong>Prescription Verification:</strong> Audit the electronic prescription for:
    <ul>
      <li>Appropriateness of dosing, renal dose adjustments, and treatment duration.</li>
      <li>Known drug allergies or duplicate therapeutic regimens.</li>
    </ul>
  </li>
  <li><strong>Stock Allocation:</strong> Verify batch number, manufacturer expiry date, and storage temperature requirements.</li>
  <li><strong>Dispensation Confirmation:</strong> Scan the medication barcode to deduct inventory in real time and generate printed dosage instruction labels.</li>
  <li><strong>Patient Counseling:</strong> Verbally explain medication timing, dietary precautions (e.g., take with meals), and common adverse effects.</li>
</ol>

<h2>3. Controlled Substances (Schedule II/III)</h2>
<ul>
  <li>Controlled narcotics (e.g. Morphine, Pethidine, Fentanyl) require a double digital signature from both the dispensing pharmacist and witnessing medical officer.</li>
</ul>""",
    },
    {
        "title": "SOP: Inpatient Ward Admission & Bed Management",
        "slug": "sop-admission-process",
        "category_slug": "clinical-modules",
        "tags": ["admission", "inpatient", "how-to"],
        "status": "published",
        "views": 160,
        "days_ago": 14,
        "content": """<h2>1. Purpose</h2>
<p>Governs the admission, bed allocation, and inpatient nursing intake workflow for medical, surgical, pediatric, and maternity wards.</p>

<h2>2. Admission Procedure</h2>
<ol>
  <li><strong>Initiation:</strong> The attending physician creates an <em>Admission Order</em> from the consultation record, specifying admitting diagnosis, care level (General, High Dependency, ICU), and dietary orders.</li>
  <li><strong>Bed Management & Assignment:</strong>
    <ul>
      <li>The Bed Coordinator views real-time ward occupancy matrices in the HMIS Bed Manager.</li>
      <li>Assign an active bed (e.g., <em>Female Medical Ward - Bed 14B</em>).</li>
    </ul>
  </li>
  <li><strong>Nursing Intake & Handover:</strong>
    <ul>
      <li>Upon physical arrival to the ward, the admitting nurse executes the <em>Nursing Intake Assessment</em>.</li>
      <li>Document baseline vitals, skin integrity assessment (Braden Scale), and fall risk score (Morse Fall Scale).</li>
      <li>Activate the Inpatient Medication Administration Record (e-MAR).</li>
    </ul>
  </li>
</ol>""",
    },
    {
        "title": "SOP: Inter-Facility & Specialist Referral Workflow",
        "slug": "sop-referral-workflow",
        "category_slug": "clinical-modules",
        "tags": ["referral", "how-to", "records"],
        "status": "published",
        "views": 195,
        "days_ago": 12,
        "content": """<h2>1. Purpose</h2>
<p>Standardizes the clinical protocol for transferring patients requiring tertiary care, advanced surgical intervention, or specialized diagnostics not available at the primary facility.</p>

<h2>2. Referral Steps</h2>
<ol>
  <li>Open the patient record and select <strong>Initiate Referral</strong>.</li>
  <li>Select the receiving tertiary facility from the verified National Health Referral Directory.</li>
  <li>Specify the primary clinical referral reason and attach recent laboratory investigations, imaging reports, and medication history.</li>
  <li><strong>Communication & Dispatch:</strong> Contact the receiving facility's triage coordinator to confirm bed availability.</li>
  <li>Generate the official <em>Standard Medical Referral Summary Document</em> with a unique tracking QR code.</li>
</ol>""",
    },
    {
        "title": "Clinical Guide: Antenatal Care (ANC) Enrollment & Monitoring",
        "slug": "how-to-record-anc-visit",
        "category_slug": "antenatal-care",
        "tags": ["anc", "maternal", "how-to"],
        "status": "published",
        "views": 230,
        "days_ago": 10,
        "content": """<h2>1. Clinical Overview</h2>
<p>The Antenatal Care (ANC) module tracks maternal health, fetal well-being, and preventive interventions throughout pregnancy according to WHO positive pregnancy experience guidelines.</p>

<h2>2. Initial ANC Booking (1st Trimester / Visit 1)</h2>
<ol>
  <li>Enroll the patient into the <strong>Maternal Health Registry</strong>.</li>
  <li>Record obstetric history: Gravidity, Parity, Number of living children, Past Caesarean sections.</li>
  <li>Calculate Estimated Date of Delivery (EDD) and Gestational Age based on Last Normal Menstrual Period (LNMP) or first-trimester ultrasound biometric dating.</li>
  <li>Order mandatory baseline screening profile: Blood Group & Rhesus, Full Blood Count, Syphilis (VDRL), HIV Rapid Test, Hepatitis B, and Urinalysis.</li>
  <li>Prescribe routine micronutrient supplementation: Ferrous Sulphate + Folic Acid (IFA).</li>
</ol>

<h2>3. Longitudinal Follow-Up Protocol</h2>
<ul>
  <li>Monitor blood pressure trends at every contact to screen for Pre-eclampsia.</li>
  <li>Document symphysis-fundal height (SFH) and fetal heart rate (FHR) from 20 weeks gestation.</li>
</ul>""",
    },
    {
        "title": "Clinical Protocol: Expanded Programme on Immunization (EPI)",
        "slug": "how-to-record-epi-immunization",
        "category_slug": "immunization-epi",
        "tags": ["epi", "vaccines", "how-to"],
        "status": "published",
        "views": 185,
        "days_ago": 8,
        "content": """<h2>1. Overview</h2>
<p>Standardizes the capture and scheduling of childhood and adult immunization schedules under the national Expanded Programme on Immunization (EPI).</p>

<h2>2. Vaccine Administration & HMIS Logging</h2>
<ol>
  <li>Retrieve the child's electronic health record using their Child Welfare Clinic (CWC) number or National Birth Certificate number.</li>
  <li>Verify vaccine eligibility against the automated chronological immunization schedule.</li>
  <li>Record vaccination details:
    <ul>
      <li><strong>Vaccine:</strong> (e.g., BCG, OPV, Pentavalent, Rotavirus, Measles-Rubella).</li>
      <li><strong>Dose Number:</strong> (e.g., Penta-1, Penta-2, Penta-3).</li>
      <li><strong>Batch & Lot Number:</strong> Scanned directly from the vial for cold-chain traceability.</li>
      <li><strong>Anatomical Site & Route:</strong> (e.g. Left upper arm, Intramuscular).</li>
    </ul>
  </li>
  <li>Save the entry to generate the automatic schedule for the next due vaccine date and dispatch an SMS reminder to the parent/guardian.</li>
</ol>""",
    },
    {
        "title": "Troubleshooting Guide: Resolving HMIS Gateway & Database Error 505",
        "slug": "resolving-database-connection-error-505",
        "category_slug": "troubleshooting",
        "tags": ["error", "troubleshooting", "infrastructure"],
        "status": "published",
        "views": 95,
        "days_ago": 6,
        "content": """<h2>1. Problem Symptoms</h2>
<p>Users report screen freezing upon authentication, HTTP 500/505 server error responses, or terminal logs stating <code>SQLAlchemy ConnectionPoolTimeout: QueuePool limit of size 20 overflow 10 reached</code>.</p>

<h2>2. Diagnostic & Remediation Steps</h2>
<ol>
  <li><strong>Check Database Liveness:</strong>
    <pre><code>pg_isready -h localhost -p 5432 -U postgres</code></pre>
  </li>
  <li><strong>Inspect Active Connection Counts:</strong>
    <pre><code>SELECT count(*), state FROM pg_stat_activity GROUP BY state;</code></pre>
  </li>
  <li><strong>Restart the Gateway Daemon:</strong>
    <pre><code>sudo systemctl restart hmis-backend</code></pre>
  </li>
  <li><strong>Verify Reverse Proxy Upstream Health:</strong>
    <pre><code>curl -I http://localhost:8000/health</code></pre>
  </li>
</ol>""",
    },
    {
        "title": "SOP: Pediatric Weight-Based Drug Dosing & Verification",
        "slug": "sop-administering-pediatric-doses",
        "category_slug": "pharmacy-dispensing",
        "tags": ["pharmacy", "pediatrics", "safety"],
        "status": "under_review",
        "views": 45,
        "days_ago": 3,
        "content": """<h2>1. Clinical Safety Protocol</h2>
<p>Pediatric drug dosing requires strict weight-based or Body Surface Area (BSA) verification to eliminate medication errors in neonates, infants, and young children.</p>

<h2>2. Mandatory Safety Checks</h2>
<ul>
  <li>Always obtain a measured weight in kilograms (kg) on the same day of prescription — never use estimated weight.</li>
  <li>Doses must be calculated using <code>mg/kg/dose</code> or <code>mg/kg/day</code> divided into specific dosing intervals.</li>
  <li>Verify that calculated pediatric doses never exceed the standard recommended maximum single adult dose.</li>
  <li>Requires independent double-check and co-signature by a supervising clinical pharmacist or pediatrician before dispensing.</li>
</ul>""",
    },
    {
        "title": "Emergency Clinical Protocol: Adult & Pediatric Resuscitation (Code Blue)",
        "slug": "emergency-resuscitation-code-blue",
        "category_slug": "clinical-modules",
        "tags": ["emergency", "resuscitation", "protocols"],
        "status": "draft",
        "views": 10,
        "days_ago": 1,
        "content": """<h2>1. Purpose</h2>
<p>Provides clear, rapid response protocols for managing cardiac and respiratory arrest in adult and pediatric patients in hospital inpatient wards and outpatient areas.</p>

<h2>2. Immediate Action Sequence (BLS / ACLS)</h2>
<ol>
  <li><strong>Activate Code Blue:</strong> Press the emergency call button or dial the facility emergency speed-dial <code>#222</code>.</li>
  <li><strong>Initiate High-Quality CPR:</strong>
    <ul>
      <li>Compress at 100 - 120 compressions/minute at a depth of 5 - 6 cm (adults).</li>
      <li>Allow complete chest recoil between compressions.</li>
      <li>Provide 30:2 compression-to-ventilation ratio until advanced airway is placed.</li>
    </ul>
  </li>
  <li><strong>Defibrillator Attachment:</strong> Attach AED / manual defibrillator pads and analyze rhythm (Shockable: VF/pVT vs Non-Shockable: Asystole/PEA).</li>
</ol>""",
    },
]


def get_or_create_tag(db, name):
    slug = name.lower().replace(" ", "-")
    tag = db.query(Tag).filter(Tag.slug == slug).first()
    if not tag:
        tag = Tag(name=name, slug=slug)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag


def seed_database():
    print("Starting comprehensive database seeding...")
    db = SessionLocal()

    try:
        # 1. Seed Users
        print("Seeding users...")
        users_data = [
            {
                "full_name": "Dr. David Admin",
                "email": "admin@healthtech.com",
                "password": "AdminPass123!",
                "role": "admin",
                "total_queries": 45,
                "days_ago": 45,
            },
            {
                "full_name": "Nurse Amina Editor",
                "email": "editor@healthtech.com",
                "password": "EditorPass123!",
                "role": "editor",
                "total_queries": 28,
                "days_ago": 30,
            },
            {
                "full_name": "Grace Viewer",
                "email": "viewer@healthtech.com",
                "password": "ViewerPass123!",
                "role": "viewer",
                "total_queries": 64,
                "days_ago": 20,
            },
        ]

        users_map = {}
        for u in users_data:
            user = db.query(User).filter(User.email == u["email"]).first()
            if not user:
                user = User(
                    full_name=u["full_name"],
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                    is_active=True,
                    is_verified=True,
                    total_queries=u["total_queries"],
                    created_at=datetime.now(timezone.utc) - timedelta(days=u["days_ago"]),
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            users_map[u["role"]] = user

        # 2. Seed Categories
        print("Seeding categories...")
        categories_data = [
            # Top-level
            {
                "name": "Getting Started",
                "slug": "getting-started",
                "description": "Onboarding, system access, and navigation basics.",
                "icon": "home",
                "sort_order": 1,
                "parent_slug": None,
            },
            {
                "name": "Clinical Modules",
                "slug": "clinical-modules",
                "description": "Workflows and user guides for clinical systems.",
                "icon": "activity",
                "sort_order": 2,
                "parent_slug": None,
            },
            {
                "name": "Troubleshooting",
                "slug": "troubleshooting",
                "description": "Common error codes, bug resolutions, and system diagnostics.",
                "icon": "alert-circle",
                "sort_order": 3,
                "parent_slug": None,
            },
            # Subcategories
            {
                "name": "First Login & Access",
                "slug": "first-login-access",
                "description": "Setting up credentials and logging into the system.",
                "icon": "key",
                "sort_order": 1,
                "parent_slug": "getting-started",
            },
            {
                "name": "Laboratory Workflows",
                "slug": "laboratory-workflows",
                "description": "Lab order entry, result validation, and printing.",
                "icon": "test-tube",
                "sort_order": 1,
                "parent_slug": "clinical-modules",
            },
            {
                "name": "Pharmacy Dispensing",
                "slug": "pharmacy-dispensing",
                "description": "Drug inventory management and prescription fulfillment.",
                "icon": "package",
                "sort_order": 2,
                "parent_slug": "clinical-modules",
            },
            {
                "name": "Antenatal Care (ANC)",
                "slug": "antenatal-care",
                "description": "Maternal health, ANC visits, and tracking.",
                "icon": "heart",
                "sort_order": 3,
                "parent_slug": "clinical-modules",
            },
            {
                "name": "Immunization (EPI)",
                "slug": "immunization-epi",
                "description": "Vaccine administration, schedules, and batch tracking.",
                "icon": "shield",
                "sort_order": 4,
                "parent_slug": "clinical-modules",
            },
        ]

        categories_map = {}
        for c in categories_data:
            cat = db.query(Category).filter(Category.slug == c["slug"]).first()
            parent_id = categories_map.get(c["parent_slug"]).id if c["parent_slug"] and c["parent_slug"] in categories_map else None
            if not cat:
                cat = Category(
                    name=c["name"],
                    slug=c["slug"],
                    description=c["description"],
                    icon=c["icon"],
                    sort_order=c["sort_order"],
                    parent_id=parent_id,
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
            categories_map[c["slug"]] = cat

        # 3. Seed Articles
        print("Seeding rich HMIS articles...")
        author = users_map["editor"] or users_map["admin"]
        articles_map = {}

        for item in HMIS_ARTICLES:
            cat = categories_map.get(item["category_slug"]) or categories_map["getting-started"]
            article = db.query(Article).filter(Article.slug == item["slug"]).first()
            if not article:
                article = Article(
                    title=item["title"],
                    slug=item["slug"],
                    content=item["content"],
                    category_id=cat.id,
                    author_id=author.id,
                    status=item["status"],
                    views=item["views"],
                    tags=", ".join(item["tags"]),
                    created_at=datetime.now(timezone.utc) - timedelta(days=item["days_ago"]),
                )
                article.tags_rel = [get_or_create_tag(db, t) for t in item["tags"]]
                db.add(article)
                db.commit()
                db.refresh(article)
            else:
                # Update content to rich HTML if existing
                article.content = item["content"]
                article.category_id = cat.id
                article.tags = ", ".join(item["tags"])
                article.tags_rel = [get_or_create_tag(db, t) for t in item["tags"]]
                db.commit()
            articles_map[item["slug"]] = article

        # 4. Seed Feedback
        print("Seeding feedback...")
        target_article_1 = articles_map.get("sop-patient-registration")
        target_article_2 = articles_map.get("sop-pharmacy-dispensing")

        if target_article_1 and not db.query(Feedback).filter(Feedback.article_id == target_article_1.id).first():
            fb1 = Feedback(
                article_id=target_article_1.id,
                user_id=users_map["viewer"].id,
                rating=5,
                comment="Extremely clear and easy to follow! The OTP step explanation helped solve a registration blocker.",
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
            )
            db.add(fb1)

        if target_article_2 and not db.query(Feedback).filter(Feedback.article_id == target_article_2.id).first():
            fb2 = Feedback(
                article_id=target_article_2.id,
                user_id=users_map["viewer"].id,
                rating=4,
                comment="Very helpful guide. The reminder on high-risk medications is critical.",
                created_at=datetime.now(timezone.utc) - timedelta(days=1),
            )
            db.add(fb2)
        db.commit()

        # 5. Seed Search Logs
        print("Seeding search logs...")
        sample_queries = [
            ("patient registration otp", 2),
            ("pharmacy dispensing queue", 1),
            ("database connection error 505", 1),
            ("how to record vitals", 1),
            ("anc visit schedule", 1),
            ("invalid laboratory query", 0),
        ]
        if db.query(SearchLog).count() == 0:
            for q, count in sample_queries:
                log = SearchLog(
                    query=q,
                    results_count=count,
                    user_id=users_map["viewer"].id,
                    created_at=datetime.now(timezone.utc) - timedelta(hours=3),
                )
                db.add(log)
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

