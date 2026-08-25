# HealthTech KB — Frontend Client

The frontend for the **HealthTech Knowledge Base (HealthTech KB)** is a clinical web application built with **React 19**, **Vite 8**, and **Tailwind CSS v4**. It provides a clean, role-tailored user experience for viewing Standard Operating Procedures (SOPs), creating rich clinical documentation, managing editorial review workflows, analyzing knowledge base metrics, and interacting with the conversational AI assistant.

---

## 🏥 Key Features & Pages

- **Articles Hub & Reader** (`/articles`, `/articles/:id`):
  - In-page search, category filtering, and tag chips.
  - Clinical procedure reader with word count reading-time estimates (`⏱ 3 min read`).
  - Contextual approval status warning banners (*Under Review, Draft, Archived*).
  - Print-friendly SOP formatting (`window.print()`).
  - Star rating and user feedback submission.
- **Editorial Workflows** (`/articles/new`, `/articles/:id/edit`, `/review`):
  - Rich Text Editor with live formatting (headings, lists, blockquotes, code, undo/redo).
  - Multi-tag selector with automated review routing for editors.
  - Review queue with approval aging metrics ("Days Waiting" chart) and inline review/rejection reason capture.
- **Admin & Clinical Analytics** (`/admin/dashboard`, `/analytics`, `/articles/low-rated`):
  - Audit logging of staff operations (deletions, role updates, publications).
  - Chatbot interaction logs, user satisfaction metrics, and latency charts.
  - Low-rated article triage queue filtered by satisfaction threshold.
- **Access Control & RBAC**:
  - Role-protected routes with automatic permission checks (`Admin`, `Editor`, `Viewer`).
  - Branded sign-in with **1-Click Demo Accounts** for instant role evaluation.
- **Conversational Clinical Assistant & Embedded Widget** (`/widget`):
  - Embedded floating copilot with persistent user satisfaction feedback.
  - Standalone embeddable widget page (`/widget?apiKey=...`) for external HMIS systems.

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
