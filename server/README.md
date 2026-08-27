# 🏥 HealthTech KB — Backend API Server

The backend API for **HealthTech Knowledge Base** is built with **FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL**, and **Alembic**. It provides secure RESTful endpoints for clinical article lifecycle management, role-based authorization, administrative auditing, full-text search, and an AI-powered conversational clinical assistant grounded in hospital SOPs.

---

## 🏛 Architecture & Key Capabilities

- **Role-Based Access Control (RBAC)**:
  - **`admin`**: Reviewer and governance lead. Cannot author articles. Can approve (`PUT /api/v1/articles/{id}/approve`), reject with feedback (`PUT /api/v1/articles/{id}/reject`), toggle publication/archival, delete articles, manage user accounts, and view immutable audit trails.
  - **`editor`**: Documentation author. Can create articles (`POST /api/v1/articles/` $\rightarrow$ automatically enters `under_review`), edit draft content, and update tag mappings.
  - **`viewer`**: Read-only clinical staff. Can browse published SOPs, search, submit star ratings and feedback comments, and query the grounded conversational AI.
  - **`widget caller`**: External HMIS integration authenticated via `X-API-Key`.
- **Grounded AI Decision Support (RAG)**:
  - OpenRouter API integration with multi-model automatic fallback pool (`openrouter/auto`, `meta-llama`, `google/gemini`, `nvidia/nemotron`).
  - Zero open-domain hallucinations: replies are strictly constrained to retrieved SOP context.
  - Sub-millisecond monotonic latency tracking and confidence scoring (`high` / `medium` / `low` / `none`).
- **Audit & Analytics System**:
  - Immutable audit logs capturing administrative operations (`action`, `target`, `user_id`, `changes`).
  - Search query logging for zero-result and high-demand clinical query analytics.
  - Low-rated SOP triage queue for flagging outdated guidelines.
- **Security & Dual-Origin CORS**:
  - Distinct CORS headers for credentialed internal dashboards vs non-credentialed external widget embeds.
  - SlowAPI rate limiting on authentication and LLM endpoints.

---

## 🛠 Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn (ASGI)
- **Database & ORM**: PostgreSQL 16 + SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth & Crypto**: Passlib (Bcrypt) + Python-Jose (JWT HS256)
- **Rate Limiting**: SlowAPI
- **LLM Client**: HTTPX + OpenRouter Multi-Model Failover

---

## 🚀 Local Development Setup

### 1. Virtual Environment & Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file in `server/`:
```env
DATABASE_URL=postgresql://kb_user:kb_pass@localhost:5432/kb_db
SECRET_KEY=your-secure-random-secret-key-at-least-32-chars
ALGORITHM=HS256

# Dashboard & external CORS
DASHBOARD_ORIGINS=http://localhost:5173,http://localhost:80,http://localhost
WIDGET_ORIGINS=http://localhost:8080,http://hmis-widget.com
WIDGET_API_KEYS=hmis_mock:d_pacLsoU27UrW0mxR5vvCt-g8M7MNDh6bTOBqK8X2Y

# Grounded LLM Copilot (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openrouter/auto
OR_SITE_URL=http://localhost:5173
OR_APP_NAME=healthtech-kb
```

### 3. Apply Database Migrations
```bash
alembic upgrade head
```

### 4. Seed Initial Knowledge Base Data
```bash
python seed_db.py
```
This populates:
- **Admin**: `admin@healthtech.com` (`AdminPass123!`)
- **Editor**: `editor@healthtech.com` (`EditorPass123!`)
- **Viewer**: `viewer@healthtech.com` (`ViewerPass123!`)
- 13 comprehensive, pre-formatted clinical SOPs, categories, tags, and feedback logs.

### 5. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs (Swagger): [`http://localhost:8000/docs`](http://localhost:8000/docs)
- Alternative Docs (ReDoc): [`http://localhost:8000/redoc`](http://localhost:8000/redoc)
- Health Check: [`http://localhost:8000/health`](http://localhost:8000/health)

---

## 🧪 Testing

Run the comprehensive unit test suite:
```bash
./venv/bin/python -m unittest discover tests
```

---

## 🐳 Docker Deployment

```bash
docker build -t healthtech-kb-server .
docker run -p 8000:8000 --env-file .env healthtech-kb-server
```

