# HealthTech Knowledge Base (HealthTech-KB)

Welcome to the **HealthTech Knowledge Base** project. This repository contains the source code for a web application designed to manage knowledge/user data in a healthcare technology setting, featuring a React frontend and a FastAPI backend.

## 📁 Repository Structure

The project is split into the following main directories:

- **[client](file:///home/abdi/Desktop/healthtech-kb/client)**: React web application built with [Vite](https://vite.dev/) and styled using [Tailwind CSS v4](https://tailwindcss.com/).
- **[server](file:///home/abdi/Desktop/healthtech-kb/server)**: FastAPI-powered backend API with PostgreSQL integration.
- **[docs](file:///home/abdi/Desktop/healthtech-kb/docs)**: Repository documentation directory containing architecture guidelines ([architecture.md](file:///home/abdi/Desktop/healthtech-kb/docs/architecture.md)) and Entity Relationship Diagrams ([erd.md](file:///home/abdi/Desktop/healthtech-kb/docs/erd.md)).

---

## 💻 Tech Stack

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint

### Backend

- **Framework**: FastAPI
- **Web Server**: Uvicorn
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL, with schema managed via **Alembic** migrations
- **Database Driver**: psycopg2-binary
- **Authentication & Security**: Passlib (Bcrypt) & Python-Jose, JWT with embedded role claim
- **Authorization**: Role-based access control (admin / editor / viewer) with hierarchy-based permission checks
- **Data Validation**: Pydantic v2

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+) and npm
- Python (3.10+)
- PostgreSQL (running locally or accessible remotely)

---

### Backend Setup

The backend entrypoint is [server/app/main.py](file:///home/abdi/Desktop/healthtech-kb/server/app/main.py), which implements JWT authentication, RBAC, and hooks into a PostgreSQL database defined in [server/app/db/session.py](file:///home/abdi/Desktop/healthtech-kb/server/app/db/session.py).

#### Step-by-Step Installation:

1. **Navigate to the server directory**:

```bash
   cd server
```

2. **Set up a Virtual Environment**:

```bash
   python3 -m venv venv
   source venv/bin/activate
```

3. **Install Dependencies**:

```bash
   pip install -r requirements.txt
```

4. **Database Configuration**:
   Create a PostgreSQL database and user, then set the connection string in a `.env` file in `server/`:

```bash
   DATABASE_URL=postgresql://kb_user:kb_pass@localhost:5432/kb_db
```

(No trailing comments on the same line as the value — `python-dotenv` only treats `#` as a comment starter when preceded by whitespace.)

5. **Run Database Migrations**:
   Schema is managed entirely through Alembic — there is no auto-create-on-startup behavior. Apply the latest schema before first run:

```bash
   alembic upgrade head
```

6. **Seed the Database** (optional, for local dev/demo data):

```bash
   python seed_db.py
```

This creates three test accounts (`admin@healthtech.com` / `editor@healthtech.com` / `viewer@healthtech.com`), sample categories, tags, and articles.

7. **Run the API Server**:

```bash
   uvicorn app.main:app --reload --port 8000
```

8. **Interactive Documentation**:
   Once started, visit:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
   - Health check: `http://localhost:8000/health`

---

### Frontend Setup

1. **Navigate to the client directory**:

```bash
   cd client
```

2. **Install Dependencies**:

```bash
   npm install
```

3. **Start the Development Server**:

```bash
   npm run dev
```

4. **Build for Production**:

```bash
   npm run build
```

---

## 🛠 Database Models & Endpoints

### Models

- **[User](file:///home/abdi/Desktop/healthtech-kb/server/app/models/user.py)**: Tracks user accounts (`full_name`, `email`, `role`), usage stats (`total_queries`), and verification status (`is_verified`). Roles: `admin`, `editor`, `viewer`.
- **[Article](file:///home/abdi/Desktop/healthtech-kb/server/app/models/article.py)**: Knowledge base content with `status` (`draft`, `under_review`, `published`, `archived`), category, author, and many-to-many tags.
- **[Category](file:///home/abdi/Desktop/healthtech-kb/server/app/models/category.py)**: Hierarchical (self-referencing) content categories.
- **[Tag](file:///home/abdi/Desktop/healthtech-kb/server/app/models/tag.py)**: Many-to-many labels for articles.
- **[AuditLog](file:///home/abdi/Desktop/healthtech-kb/server/app/models/audit_log.py)**: Records admin-sensitive actions (role changes, user/article deletes, publish/archive) with actor, action, target, and timestamp.
- **[ChatLog / ChatMessage](file:///home/abdi/Desktop/healthtech-kb/server/app/models/chat.py)**: Persisted chatbot session history.

### API Endpoints

All routes are prefixed with `/api/v1`.

- **Authentication** (`/auth`):
  - `POST /auth/login`: JWT login (form-encoded `username`/`password`); returns an access token with an embedded role claim.

- **User Management** (`/users`) — admin-only for list/update/delete:
  - `GET /users/`: List all users.
  - `PUT /users/{user_id}`: Update user details, including role (logged to the audit trail).
  - `DELETE /users/{user_id}`: Remove a user (logged to the audit trail).

- **Articles** (`/articles`) — role-gated (editor+ to create/edit, admin-only to publish/archive/delete):
  - `POST /articles/`: Create a new article (default status `draft`).
  - `GET /articles/`: List articles — viewers see published only; editors/admins see all statuses.
  - `GET /articles/{article_id}`: Retrieve a single article (same visibility rule as list).
  - `PUT /articles/{article_id}`: Update title/content/category/tags/status. Publishing or archiving requires admin.
  - `DELETE /articles/{article_id}`: Delete an article (admin-only, logged to the audit trail).

- **Chat** (`/chat`):
  - `POST /chat/`: Submit a chat message.
  - `GET /chat/history`: Retrieve chat history for the current session.

- **Utility**:
  - `GET /health`: Basic liveness check, returns `{"status": "ok"}`.
