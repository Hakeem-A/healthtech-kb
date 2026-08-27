# 🏥 HealthTech KB — Frontend Client

The frontend for the **HealthTech Knowledge Base (HealthTech KB)** is a modern, responsive single-page application (SPA) built with **React 19**, **Vite 8**, and **Tailwind CSS v4**. It provides a clean, role-tailored user experience for discovering Standard Operating Procedures (SOPs), authoring rich clinical documentation, managing editorial review pipelines, analyzing knowledge base usage, and interacting with the grounded conversational AI assistant.

---

## 🏥 Key Pages & Capabilities

- **Articles Hub & Reader** (`/articles`, `/articles/:id`):
  - Fast search, category filtering, and interactive tag badges.
  - Clinical procedure reader with word count reading-time estimates (`⏱ X min read`).
  - Contextual approval status warning banners (*Under Review, Draft, Archived*).
  - Reviewer Revision Feedback alert banner displaying clinical feedback if an article was sent back.
  - Print-friendly SOP styling (`window.print()`).
  - Interactive star rating and reader comment submissions.
- **Editorial Workflows** (`/articles/new`, `/articles/:id/edit`, `/review`):
  - **TipTap Rich Text Editor** with live formatting (headings, bullet lists, blockquotes, code blocks, undo/redo).
  - Multi-tag selector with automated review routing for editors.
  - **Review Queue** (`/review`) with approval aging metrics ("Days Waiting" chart) and inline *Approve & Publish* / *Reject with Reason* modal dialogs.
- **Admin & Clinical Analytics** (`/admin/dashboard`, `/analytics`, `/articles/low-rated`):
  - Audit logging of staff operations (deletions, role updates, publications).
  - Chatbot interaction logs, user satisfaction metrics, and query latency distributions.
  - Low-rated article triage queue filtered by satisfaction threshold.
- **Access Control & RBAC**:
  - Role-protected routes with automatic permission checks (`Admin`, `Editor`, `Viewer`).
  - Branded sign-in screen with **1-Click Demo Quick Fill** buttons for immediate role evaluation.
- **Conversational Clinical Assistant & Embedded Widget** (`/widget`):
  - Embedded floating copilot with persistent conversation history, confidence indicators, and citation links.
  - Standalone embeddable widget page (`/widget?apiKey=...`) designed for `<iframe>` embedding inside external hospital information systems.

---

## 🛠 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8 (Rolldown-powered)
- **Styling**: Tailwind CSS v4 + `@tailwindcss/typography` styling
- **Routing**: React Router v7
- **Data Visualization**: Recharts
- **Rich Text Editing**: TipTap (`@tiptap/react`, `@tiptap/starter-kit`)
- **Sanitization**: DOMPurify
- **Icons**: Custom SVG Icon system ([`src/components/icons.jsx`](src/components/icons.jsx))

---

## 🚀 Local Development

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The client will start at `http://localhost:5173`. By default, it communicates with the FastAPI backend running at `http://localhost:8000`.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory.

---

## 🐳 Docker Deployment

The client includes a multi-stage `Dockerfile` using Nginx Alpine:
```bash
docker build -t healthtech-kb-client .
docker run -p 80:80 healthtech-kb-client
```
When running with `docker compose up`, the frontend is served on `http://localhost` (Port `80`) with built-in reverse proxying for `/api/` and `/health`.

