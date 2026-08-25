# HealthTech Knowledge Base — Dockerization & Deployment Manual

This document provides a comprehensive operational guide for containerizing, orchestrating, and deploying the **HealthTech Knowledge Base (HealthTech KB)** across local, staging, and production cloud environments.

---

## 1. System Container Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Cloudflare / CDN / DNS   │
                                  │       (HTTPS / SSL / Port 443)│
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Ingress / Nginx Gateway     │
                                  └───────┬───────────────┬───────┘
                                          │               │
                     ┌────────────────────┘               └────────────────────┐
                     │ /                                                       │ /api/
                     ▼                                                         ▼
       ┌───────────────────────────┐                             ┌───────────────────────────┐
       │   Frontend Container      │                             │    Backend Container      │
       │   (Nginx Alpine + React)  │                             │   (FastAPI + Python 3.12) │
       │   Port: 80                │                             │   Port: 8000              │
       └───────────────────────────┘                             └─────────────┬─────────────┘
                                                                               │
                                                                 ┌─────────────┴─────────────┐
                                                                 ▼                           ▼
                                                   ┌───────────────────────────┐ ┌───────────────────────┐
                                                   │   PostgreSQL 16 DB        │ │   Gemini LLM API      │
                                                   │   (Port 5432 / Persistent)│ │   (External AI)       │
                                                   └───────────────────────────┘ └───────────────────────┘
```

### Component Containers

| Service | Base Image | Build Strategy | Exposed Port | Role |
| :--- | :--- | :--- | :---: | :--- |
| **`client`** | `nginx:alpine` | Multi-stage (Node 20 build → Nginx runtime) | `80` | Serves compiled React assets, handles SPA fallback routing, and proxies `/api/` |
| **`server`** | `python:3.12-slim` | Single-stage, minimal runtime | `8000` | Executes FastAPI application, Alembic migrations, and RAG services |
| **`postgres`** | `postgres:16-alpine` | Official alpine image | `5432` | Relational database with persistent volume mount (`postgres_data`) |

---

## 2. Local & Staging Orchestration (Docker Compose)

The repository provides a turnkey [`docker-compose.yml`](../docker-compose.yml) that starts the entire stack with a single command.

### 2.1 Starting the Stack

```bash
# Build images and start containers in foreground
docker compose up --build

# Or run in detached (background) mode
docker compose up -d --build
```

### 2.2 Verifying Container Health

```bash
docker compose ps
```

Expected output:
```
NAME                   IMAGE                  STATUS                    PORTS
healthtech-kb-db       postgres:16-alpine     Up (healthy)              0.0.0.0:5432->5432/tcp
healthtech-kb-server   healthtech-kb-server   Up                        0.0.0.0:8000->8000/tcp
healthtech-kb-client   healthtech-kb-client   Up                        0.0.0.0:80->80/tcp
```

### 2.3 Access Points
- **Web App**: `http://localhost`
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Liveness Probe**: `http://localhost:8000/health`

### 2.4 Stopping & Cleanup

```bash
# Stop containers without losing database data
docker compose down

# Stop containers and delete database volume (fresh start)
docker compose down -v
```

---

## 3. Production Deployment Architectures

### Target A: Serverless Containers (Google Cloud Run / AWS App Runner / Render)
*Best for: Zero infrastructure maintenance, automatic scaling to zero, cost efficiency.*

```mermaid
flowchart TD
    DNS["Custom Domain (e.g. kb.hospital.org)"] --> CloudFront["Cloud CDN / Cloudflare"]
    CloudFront -->|/*| CR_Client["Cloud Run: Client (Nginx)"]
    CloudFront -->|/api/*| CR_Server["Cloud Run: Server (FastAPI)"]
    CR_Server --> CloudSQL["Managed PostgreSQL (Cloud SQL / RDS)"]
    CR_Server --> SecretMgr["Secret Manager (Env Vars & API Keys)"]
```

#### Step-by-Step Google Cloud Run Deployment:
1. **Provision Managed Database**:
   ```bash
   gcloud sql instances create healthtech-db --database-version=POSTGRES_16 --tier=db-f1-micro --region=us-central1
   gcloud sql databases create healthtech_kb --instance=healthtech-db
   ```
2. **Build and Push Backend Image**:
   ```bash
   gcloud builds submit server/ --tag gcr.io/$PROJECT_ID/healthtech-server
   ```
3. **Deploy Backend to Cloud Run**:
   ```bash
   gcloud run deploy healthtech-server \
     --image gcr.io/$PROJECT_ID/healthtech-server \
     --region us-central1 \
     --set-env-vars="DATABASE_URL=postgresql://user:pass@/healthtech_kb?host=/cloudsql/$PROJECT_ID:us-central1:healthtech-db,SECRET_KEY=prod-secret,GEMINI_API_KEY=your-key" \
     --add-cloudsql-instances $PROJECT_ID:us-central1:healthtech-db \
     --allow-unauthenticated
   ```
4. **Build and Deploy Frontend**:
   ```bash
   gcloud builds submit client/ --tag gcr.io/$PROJECT_ID/healthtech-client
   gcloud run deploy healthtech-client \
     --image gcr.io/$PROJECT_ID/healthtech-client \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

### Target B: Single VPS with Docker Compose & Automated SSL (DigitalOcean / AWS EC2 / Linode)
*Best for: Rapid setup, predictable fixed monthly cost ($10-$20/mo).*

1. **Provision VPS**:
   - Ubuntu 24.04 LTS (2 vCPU, 4GB RAM recommended).
   - Open ports `80` (HTTP), `443` (HTTPS), and `22` (SSH) in firewall.
2. **Install Docker Engine & Compose**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-v2
   sudo systemctl enable --now docker
   ```
3. **Clone Repository & Configure Environment**:
   ```bash
   git clone https://github.com/your-org/healthtech-kb.git /opt/healthtech-kb
   cd /opt/healthtech-kb
   cp server/.env.example server/.env
   # Edit .env with production secrets
   ```
4. **Attach Reverse Proxy with Automatic SSL (Caddy or Nginx Certbot)**:
   Example `Caddyfile` for instant HTTPS:
   ```caddyfile
   kb.hospital.org {
       reverse_proxy localhost:80
   }
   ```
5. **Start Systemd Service for Persistence**:
   ```bash
   docker compose up -d --build
   ```

---

## 4. Continuous Integration & Continuous Deployment (CI/CD)

Example GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Test, Build & Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Run Backend Unit Tests
        run: |
          cd server
          python -m venv venv
          ./venv/bin/pip install -r requirements.txt
          ./venv/bin/python -m unittest discover tests

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Test Frontend Build
        run: |
          cd client
          npm ci
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Cloud
        run: |
          echo "Triggering automated container build and deployment..."
```

---

## 5. Environment Variables Reference

| Variable | Required | Scope | Description | Example |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Server | PostgreSQL connection string | `postgresql://user:pass@host:5432/healthtech_kb` |
| `SECRET_KEY` | **Yes** | Server | Cryptographic key for JWT signatures | `random-64-char-hex-string` |
| `GEMINI_API_KEY` | Optional | Server | Google Gemini API key for AI assistant | `AIzaSy...` |
| `CORS_ORIGINS` | **Yes** | Server | Allowed frontend origins (comma-separated) | `https://kb.hospital.org` |
| `WIDGET_API_KEYS`| **Yes** | Server | Host-to-key map for embedded widget callers | `hmis_prod:secret-key-123` |
| `POSTGRES_USER` | Local/Compose | DB | PostgreSQL root username | `postgres` |
| `POSTGRES_PASSWORD` | Local/Compose | DB | PostgreSQL root password | `secure-db-password` |
| `POSTGRES_DB` | Local/Compose | DB | Default database name | `healthtech_kb` |

---

## 6. Operational Runbook

### Database Backups
Automate nightly PostgreSQL backups:
```bash
# Dump compressed database backup
docker compose exec postgres pg_dump -U postgres healthtech_kb | gzip > backup_$(date +%F).sql.gz

# Restore database from backup
gunzip -c backup_2026-08-25.sql.gz | docker compose exec -T postgres psql -U postgres -d healthtech_kb
```

### Applying Schema Migrations in Production
```bash
docker compose exec server alembic upgrade head
```

### Health & Monitoring
- **Uptime Monitoring**: Configure UptimeRobot / Datadog to poll `GET /health` every 60 seconds.
- **Log Inspection**:
  ```bash
  docker compose logs -f server
  docker compose logs -f client
  ```
