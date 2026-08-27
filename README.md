# 🏥 HealthTech Knowledge Base (HealthTech KB)

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-blue.svg)](client/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy%202.0-green.svg)](server/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](server/)
[![Container](https://img.shields.io/badge/Container-Docker%20%2B%20Compose-2496ED.svg)](docker-compose.yml)
[![Tests](https://img.shields.io/badge/Tests-15%2F15%20Passing-brightgreen.svg)](server/tests/)

**HealthTech Knowledge Base** is an enterprise-grade clinical standard operating procedure (SOP) management and grounded AI decision-support platform designed for hospital networks, healthcare providers, and Health Management Information System (HMIS) integrations.

It pairs structured clinical documentation authoring and rigorous multi-stage governance workflows with a strictly grounded conversational AI copilot to prevent hallucinations in mission-critical medical environments.

---

## 🏛 High-Level Architecture

```
                             ┌─────────────────────────────────────────────────┐
                             │       Clinical Staff & Mobile Practitioners     │
                             │         (React 19 + Vite 8 + Tailwind v4)       │
                             └────────────────────────┬────────────────────────┘
                                                      │
                             ┌────────────────────────┴────────────────────────┐
                             │               Nginx Reverse Proxy               │
                             │         Port 80 (SPA Routing & Static)          │
                             └────────────────────────┬────────────────────────┘
                                                      │ /api/v1/
                                                      ▼
                             ┌─────────────────────────────────────────────────┐
                             │            FastAPI Application Core             │
                             │       (JWT Auth, Dual-CORS, SlowAPI Limiter)    │
                             └──────────┬───────────────────────────┬──────────┘
                                        │                           │
                   ┌────────────────────┘                           └───────────────────┐
                   ▼                                                                    ▼
    ┌─────────────────────────────┐                                      ┌─────────────────────────────┐
    │     PostgreSQL 16 Engine    │                                      │   Multi-Model OpenRouter    │
    │  (10 Tables, Alembic Schema)│                                      │  (Strictly Grounded RAG AI) │
    └─────────────────────────────┘                                      └─────────────────────────────┘
```

---

## 🌟 Core System Capabilities

1. **Structured Clinical Documentation & Rich Text Authoring**:
   - TipTap-powered WYSIWYG editor for authoring clinical guidelines, tables, medication protocols, and triage workflows.
   - Multi-tag categorization with calculated reading time (`⏱ X min read`) and print-friendly formatting (`window.print()`).
   - XSS sanitization via DOMPurify on all rendered HTML content.

2. **Rigorous Clinical Governance & Editorial Review Pipeline**:
   - **Editor Role**: Authors and submits new SOPs. Submissions are automatically placed in `under_review`.
   - **Admin Role**: Governance leads review pending SOPs, **Approve & Publish** procedures, or **Reject with Reason** (logging structured feedback for the author).
   - **Viewer Role**: Clinical and administrative staff with read-only search and SOP reading access.

3. **Grounded AI Decision Support Copilot (RAG)**:
   - Clinical assistant strictly grounded in published hospital SOPs—zero open-domain medical hallucinations.
   - Multi-model automatic fallback pool (`openrouter/auto`, `meta-llama`, `google/gemini`, `nvidia/nemotron`, etc.).
   - Multi-turn conversation context, query confidence rating (`high` / `medium` / `low` / `none`), and assistant response time latency tracking via monotonic timers.
   - Fallback deterministic citations if external LLM providers are unavailable.

4. **Continuous Quality Assurance & Analytics Dashboard**:
   - 1-to-5 star reader rating system with written feedback submissions.
   - Low-rated article triage queue (`/articles/low-rated`) to identify outdated or unclear clinical guidelines.
   - Immutable audit logs capturing administrative actions, role assignments, and publication lifecycle events.
   - Zero-result search query analytics for detecting knowledge base gaps.

5. **Cross-Origin HMIS Embeddable Widget**:
   - Standalone chat widget page (`/widget?apiKey=...`) ready for `<iframe>` embedding directly within third-party HMIS and EHR dashboards.
   - Dual-origin CORS architecture isolating credentialed dashboard users from API-key authenticated external widget hosts.

---

## ⚡ 1-Click Launch with Docker Compose (Recommended)

Start the full stack (PostgreSQL + FastAPI + React/Nginx) with a single command:

```bash
docker compose up -d --build
```

### 🌐 Service Endpoints

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Dashboard** | [`http://localhost`](http://localhost) | Production React application served via Nginx (Port `80`) |
| **Backend API** | [`http://localhost:8001`](http://localhost:8001) | Direct FastAPI REST service (Port `8001`) |
| **Interactive Docs** | [`http://localhost:8001/docs`](http://localhost:8001/docs) | Swagger UI for all 24 REST endpoints |
| **Health Probe** | [`http://localhost/health`](http://localhost/health) | Nginx & database connectivity healthcheck |
| **HMIS Mock Host** | [`mock-hmis.html`](file:///home/abdi/Desktop/healthtech-kb/mock-hmis.html) | Standalone test page demonstrating embedded widget integration |

---

## 👥 Demo User Accounts (Pre-Seeded)

The login screen includes **1-Click Quick Fill** buttons for immediate role testing:

| Role | Email | Password | Primary Demo Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@healthtech.com` | `AdminPass123!` | Review queue (`/review`), Approve/Reject with feedback, Publish/Archive/Delete, User Management, Audit Logs, Analytics |
| **Editor** | `editor@healthtech.com` | `EditorPass123!` | Author SOPs (`/articles/new`), Edit drafts (`/articles/:id/edit`), view rejection feedback alerts |
| **Viewer** | `viewer@healthtech.com` | `ViewerPass123!` | Search knowledge base, read clinical protocols, submit star ratings, query AI copilot |

---

## 📋 Pre-Seeded Clinical Procedures & Protocols

The database comes pre-populated with 13 comprehensive, structured hospital SOPs:
1. `SOP: Patient Registration & Identity Verification` (Intake & biometric/OTP verification)
2. `How to Schedule & Manage Outpatient Appointments` (Scheduling & clinic queues)
3. `SOP: Triage & Vital Signs Recording` (MEWS scoring & emergency categorization)
4. `SOP: Clinical Consultation & Electronic Prescribing` (CDSS interaction checks)
5. `SOP: Diagnostic Order Processing & Specimen Handling` (5-stage laboratory specimen flow)
6. `SOP: Inpatient Ward Admission & Bed Management` (Bed allocation & nursing intake)
7. `SOP: Pharmacy Medication Dispensing & Inventory Tracking` (5 Rights of medication safety)
8. `SOP: Patient Discharge & Billing Clearance` (Summary generation & multi-payer settlement)
9. `Expanded Program on Immunization (EPI) Protocol` (Pediatric cold-chain & vaccine tracking)
10. `Pediatric Medication Dosage Verification Protocol` (Weight/BSA dosing rules)
11. `Troubleshooting Guide: Resolving HMIS Gateway Error 505` (Infrastructure & database recovery)
12. `Standard Emergency Protocol: Code Blue (Adult Resuscitation)` (BLS/ACLS sequence & crash cart)
13. `Laboratory Critical Values Notification Protocol` (Panic value escalation timelines)

---

## 🎯 Live Demo Walkthrough Script

Follow these steps to demonstrate the platform's core workflows:

```
[1. Clinical Reader & Search]
 └─ Log in as Viewer (1-Click button)
 └─ Search "triage" or "Code Blue" in the search bar
 └─ Open an SOP, inspect reading time estimate, status badge, and rate it 5 stars with a comment

[2. Grounded AI Copilot & Safety Guardrails]
 └─ Open the Chat Copilot drawer
 └─ Ask: "What are the vital signs thresholds for a high MEWS score?"
 └─ Observe: The AI answers using the exact table from SOP #3, citing the source document with latency tracking

[3. Governance & Editorial Review Pipeline]
 └─ Log in as Editor (1-Click button)
 └─ Navigate to "+ New Article", author a new draft SOP using the rich TipTap editor, and submit
 └─ Note: Article is automatically routed to "Under Review"
 └─ Log in as Admin (1-Click button)
 └─ Open the Review Queue (/review) -> Click "Reject with Reason" -> Enter revision instructions
 └─ Log back in as Editor -> View the article to inspect the prominent Rejection Feedback alert banner!
 └─ Edit and resubmit -> Admin clicks "Approve & Publish"

[4. Operations & Quality Assurance]
 └─ As Admin, open /admin/dashboard to inspect Audit Logs and Query Latencies
 └─ Open /articles/low-rated to inspect low-scoring articles flagged for clinical updates

[5. HMIS Integration Widget]
 └─ Open mock-hmis.html in your browser to demonstrate the embedded iframe widget functioning in an external host
```

---

## 📁 Repository Organization

```
healthtech-kb/
├── client/                     # React 19 + Vite 8 SPA Frontend
│   ├── src/                    # Components, pages, auth context, API client
│   ├── nginx.conf              # Production Nginx reverse-proxy & routing
│   ├── Dockerfile              # Production multi-stage Nginx container
│   └── README.md               # Frontend documentation & architecture
├── server/                     # FastAPI Backend Application
│   ├── app/                    # API endpoints, models, schemas, services
│   ├── alembic/                # Database migrations (10 models)
│   ├── tests/                  # Automated unit test suite (15 tests)
│   ├── seed_db.py              # Clinical SOP & demo account seed script
│   ├── Dockerfile              # Python 3.12 production container
│   └── README.md               # Backend documentation & API guide
├── docs/                       # Technical Specifications & Runbooks
│   ├── architecture.md         # Full architecture, RBAC matrix, & RAG sequence diagram
│   ├── deployment.md           # Production deployment runbook & cloud configurations
│   ├── erd.md                  # Complete database schema & Mermaid ERD
│   └── api-collection.json     # Postman/OpenAPI v2.0 collection for all 24 endpoints
├── mock-hmis.html              # Standalone HMIS widget embed test harness
├── docker-compose.yml          # Container orchestration specification
└── README.md                   # System documentation & quickstart
```

---

## 🧪 Running Automated Tests

Run the backend test suite:

```bash
cd server
./venv/bin/python -m unittest discover tests
```

Expected output:
```
Ran 15 tests in ~15s
OK
```

---

## 🛡 Security & Compliance Architecture

- **Token Security**: Stateless JWTs signed with `HS256`, containing user ID, role, and expiration.
- **Strict RBAC Enforcement**: Role rank verification on all protected endpoints.
- **Data Protection**: Passwords hashed with `bcrypt`.
- **Content Sanitization**: Markdown and rich HTML sanitized through DOMPurify.
- **Rate Limiting**: SlowAPI protection on `/api/v1/auth/login` and `/api/v1/chat/`.
- **Dual CORS Isolation**: Separate policies for credentialed application users and external widget hosts.
- **Audit Trails**: Non-repudiable audit logging for sensitive operations (article approvals, deletions, and user management).
