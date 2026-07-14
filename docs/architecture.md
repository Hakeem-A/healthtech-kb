# Architecture -- HealthTech KB + Chatbot System

## Overview

System includes: - Web App (Admin/User) - External HMIS Chatbot Widget -
FastAPI Backend - PostgreSQL Database

## Key Requirement Coverage

-   CORS enabled for external widget
-   JWT authentication for users
-   API contract between widget ↔ backend

``` mermaid
flowchart TD

    subgraph Clients
        WebApp[Web App (Admin Dashboard)]
        Widget[HMIS Chatbot Widget (External Origin)]
    end

    subgraph Backend
        API[FastAPI Server]
        Auth[JWT Auth Service]
        Chat[Chat Service]
        Article[Article Service]
    end

    DB[(PostgreSQL)]

    WebApp --> API
    Widget -->|CORS Request| API

    API --> Auth
    API --> Chat
    API --> Article

    Auth --> DB
    Chat --> DB
    Article --> DB
```

## CORS Configuration

-   Allow external HMIS origin
-   Example: allow_origins = \["http://localhost:3000",
    "http://hmis-widget.com"\]

## API Contract (Core Endpoints)

-   POST /login
-   POST /users
-   GET /articles
-   POST /chat
-   GET /chat/history

## Security

-   JWT authentication
-   Password hashing (bcrypt)
-   Role-based access (admin/user)

## Flow

1.  Widget sends chat request → Backend (CORS)
2.  Backend processes + queries articles
3.  Response returned to widget
4.  Chat stored in DB