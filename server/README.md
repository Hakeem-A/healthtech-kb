# HealthTech KB — Backend API Server

The backend API for **HealthTech Knowledge Base** is built with **FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL**, and **Alembic**. It provides secure RESTful endpoints for clinical article lifecycle management, role-based authorization, administrative auditing, full-text search, and an AI-powered conversational clinical assistant grounded in hospital SOPs.

---

## 🏛 Architecture & Capabilities

- **Role-Based Access Control (RBAC)**:
  - Strict hierarchical role validation: `admin` > `editor` > `viewer`.
  - JWT Bearer authentication with embedded role claims and fast revocation support.
- **Article Lifecycle & Editorial Review**:
  - Full CRUD with draft, under review, published, and archived state transitions.
  - Category hierarchies and many-to-many tag relationships.
  - Review queue management with rejection reason tracking.
  - Reader feedback rating system (1-5 stars with comments and aggregate score metrics).
- **Audit & Analytics System**:
  - Immutable audit logs capturing administrative operations (`action`, `target`, `user_id`, `changes`).
  - Search query logging for zero-result / high-demand clinical query analytics.
- **Clinical Chatbot Copilot & Grounding**:
  - Grounded RAG search over published hospital SOPs and clinical guidelines.
  - Multi-turn conversation support and assistant latency tracking using monotonic timers.
  - Standalone HMIS embed widget authentication via `X-API-Key`.
- **Security & Rate Limiting**:
  - SlowAPI rate limiting on authentication and LLM endpoints.
  - CORS header protection and parameter sanitization.

---

## 🛠 Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn (ASGI)
- **Database & ORM**: PostgreSQL + SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth & Crypto**: Passlib (Bcrypt) + Python-Jose (JWT)
- **Rate Limiting**: SlowAPI

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
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthtech_kb
SECRET_KEY=your-secure-random-secret-key
GEMINI_API_KEY=your-gemini-api-key-optional
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost
WIDGET_API_KEYS=demo-widget-api-key
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
- Clinical categories, tags, standard operating procedures, and feedback logs.

### 5. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Alternative Docs (ReDoc): `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

---

## 🧪 Testing

Run the comprehensive unit test suite:
```bash
./venv/bin/python -m unittest discover tests
```

---

## 🐳 Docker Container

```bash
docker build -t healthtech-kb-server .
docker run -p 8000:8000 --env-file .env healthtech-kb-server
```
