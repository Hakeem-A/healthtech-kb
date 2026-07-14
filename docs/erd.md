# -- HealthTech Knowledge Base System

## Scope

Supports: - Articles (knowledge base) - Users & roles - Chatbot
interactions (HMIS widget) - Chat logs/history

``` mermaid
erDiagram
    USERS ||--o{ ARTICLES : creates
    USERS ||--o{ CHAT_LOGS : initiates
    USERS ||--o{ ROLES : assigned

    ARTICLES ||--o{ ARTICLE_TAGS : has
    ARTICLES ||--o{ CHAT_LOGS : referenced_in

    CHAT_LOGS ||--o{ CHAT_MESSAGES : contains

    USERS {
        int id
        string email
        string password_hash
        string role
        datetime created_at
    }

    ROLES {
        int id
        string name
    }

    ARTICLES {
        int id
        string title
        text content
        string category
        int created_by
        datetime created_at
    }

    ARTICLE_TAGS {
        int id
        int article_id
        string tag
    }

    CHAT_LOGS {
        int id
        int user_id
        string session_id
        datetime created_at
    }

    CHAT_MESSAGES {
        int id
        int chat_log_id
        string sender
        text message
        datetime timestamp
    }
```