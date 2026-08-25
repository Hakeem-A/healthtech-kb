# HealthTech Knowledge Base (HealthTech KB)

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-blue.svg)](client/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy-green.svg)](server/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-blue.svg)](server/)
[![Container](https://img.shields.io/badge/Container-Docker%20%2B%20Compose-2496ED.svg)](docker-compose.yml)

**HealthTech Knowledge Base** is an enterprise-grade clinical knowledge management and decision support platform tailored for hospital networks, HMIS integrations, and clinical care teams. It combines structured Standard Operating Procedure (SOP) authoring, rigorous editorial review workflows, granular Role-Based Access Control (RBAC), and a grounded conversational AI assistant.

---

## 🏛 System Architecture

```
                                  ┌─────────────────────────────┐
                                  │      Client Web / Mobile    │
                                  │   (React 19 + Vite 8 + Nginx)│
                                  └──────────────┬──────────────┘
                                                 │
                                                 │ HTTPS / REST API
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │    FastAPI Application Core │
                                  │  (JWT Auth, RBAC, Limiter)  │
                                  └──────┬───────────────┬──────┘
                                         │               │
                     ┌───────────────────┘               └───────────────────┐
                     ▼                                                       ▼
      ┌─────────────────────────────┐                         ┌─────────────────────────────┐
      │     PostgreSQL Database     │                         │   Gemini / LLM Grounding    │
      │  (Alembic Schema & Models)  │                         │   (SOP RAG Decision Copilot)│
      └─────────────────────────────┘                         └─────────────────────────────┘
```

---

## 📁 Repository Structure

```
healthtech-kb/
├── client/                     # React 19 Frontend Web Application
│   ├── src/                    # Components, pages, context, and API clients
│   ├── nginx.conf              # Production Nginx reverse-proxy & routing
│   ├── Dockerfile              # Multi-stage production container build
│   └── README.md               # Frontend architecture & guide
├── server/                     # FastAPI Backend API Server
│   ├── app/                    # API endpoints, models, schemas, and services
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Automated unit test suite
│   ├── seed_db.py              # Initial clinical seed data & demo users
│   ├── Dockerfile              # Lightweight Python 3.12 container
├── docs/                       # Architecture diagrams, ERD specs, & deployment manual
│   ├── architecture.md         # System architecture & RBAC matrix
│   ├── erd.md                  # Entity Relationship Diagram & schema models
│   ├── deployment.md           # Dockerization & production deployment guide
│   └── api-collection.json     # Postman/OpenAPI v2.0 endpoint collection
├── docker-compose.yml          # Single-command full-stack container orchestration
└── README.md                   # Project overview & quickstart guide
```

---

## ⚡ Quickstart with Docker Compose (Recommended)

Run the entire application (PostgreSQL + FastAPI Backend + React/Nginx Frontend) in a single command:

```bash
docker compose up --build
```

- **Web Application**: [`http://localhost`](http://localhost) (or port `80`)
- **Backend API**: [`http://localhost:8000`](http://localhost:8000)
- **Interactive Swagger Docs**: [`http://localhost:8000/docs`](http://localhost:8000/docs)

### Pre-Seeded 1-Click Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@healthtech.com` | `AdminPass123!` | Review queue, publish/archive, user management, audit logs, low-rated triage |
| **Editor** | `editor@healthtech.com` | `EditorPass123!` | Create, edit, and submit clinical SOPs for editorial review |
| **Viewer** | `viewer@healthtech.com` | `ViewerPass123!` | Search & read published SOPs, rate procedures, query AI assistant |

---

## 💻 Local Development Setup (Without Docker)

### 1. Prerequisites
- **Node.js**: v18+ and npm
- **Python**: 3.10+
- **PostgreSQL**: 14+ running locally

### 2. Backend Setup
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file with your database connection
echo 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthtech_kb' > .env
echo 'SECRET_KEY=insecure-dev-secret-key-12345678' >> .env

# Run database migrations and seed data
alembic upgrade head
python seed_db.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

Run the backend unit test suite:
```bash
cd server
./venv/bin/python -m unittest discover tests
```

---

## 🚀 Production Deployment Plan

### Option 1: Docker Compose on VPS (AWS EC2 / DigitalOcean / Linode)
1. Provision a Linux server with Docker and Docker Compose installed.
2. Clone the repository and configure environment variables in `.env`.
3. Run `docker compose up -d --build`.
4. Point a domain (e.g. `kb.hospital.org`) and attach Let's Encrypt SSL via Certbot or Cloudflare.

### Option 2: Managed Cloud Containers (Google Cloud Run / AWS ECS / Render)
1. **Database**: Provision a managed PostgreSQL instance (e.g., Cloud SQL, AWS RDS, Supabase).
2. **Backend**:
   - Build and push `server/Dockerfile` to Google Artifact Registry / AWS ECR.
   - Deploy as a stateless service with environment variables (`DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`).
3. **Frontend**:
   - Build and deploy `client/Dockerfile` or host the static build (`npm run build`) on Vercel / Cloudflare Pages / AWS S3 + CloudFront with API rewrite rules pointing to the backend.

---

## 🛡 Security & Compliance

- **Authentication**: JWT tokens with role claims, secure hashing via Bcrypt.
- **Authorization**: Hierarchical role-based access checks (`admin` > `editor` > `viewer`).
- **Audit Trails**: Non-repudiable audit logging for sensitive actions (user modifications, article publication, deletions).
- **Rate Limiting**: Defenses against brute-force and request flooding via SlowAPI.
- **XSS & Content Sanitization**: Rich HTML procedures sanitized with DOMPurify.
