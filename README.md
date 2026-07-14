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
- **Database Driver**: psycopg2-binary
- **Authentication & Security**: Passlib (Bcrypt) & Python-Jose
- **Data Validation**: Pydantic v2

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) and npm
- Python (3.10+)
- PostgreSQL (configured database and user)

---

### Backend Setup

The backend has two main Entrypoints:
1. **Mock Backend**: Located at [server/main.py](file:///home/abdi/Desktop/healthtech-kb/server/main.py), which uses a mock in-memory user list database.
2. **Production Backend**: Located at [server/app/main.py](file:///home/abdi/Desktop/healthtech-kb/server/app/main.py), which implements user authentication routes and hooks into a PostgreSQL database defined in [server/app/db/session.py](file:///home/abdi/Desktop/healthtech-kb/server/app/db/session.py).

#### Step-by-Step Installation:

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Set up a Virtual Environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Database Configuration**:
   Make sure you have a PostgreSQL database running and configured. You can customize the connection URL in [server/app/db/session.py](file:///home/abdi/Desktop/healthtech-kb/server/app/db/session.py):
   ```python
   DATABASE_URL = "postgresql://kb_user:kb_pass@localhost:5432/kb_db"
   ```

5. **Run the API Server**:
   To run the production-ready PostgreSQL backed server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Or to run the simple mock server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

6. **Interactive Documentation**:
   Once started, visit:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

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
- **[User](file:///home/abdi/Desktop/healthtech-kb/server/app/models/user.py)**: Tracks user accounts, details (`full_name`, `email`, `role`), usage stats (`total_queries`), and verification status (`is_verified`).

### API Endpoints
- **Authentication**:
  - `POST /login`: Standard JWT login (handled by [server/app/routes/auth.py](file:///home/abdi/Desktop/healthtech-kb/server/app/routes/auth.py)).
- **User Management**:
  - `POST /users`: Register a new user.
  - `GET /users`: Retrieve all registered users.
  - `GET /users/{user_id}`: Retrieve details for a specific user.
  - `DELETE /users/{user_id}`: Remove a user.
- **Utility**:
  - `GET /test-db`: Performs connection health check on the database.
