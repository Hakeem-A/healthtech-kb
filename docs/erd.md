# HealthTech Knowledge Base — Entity Relationship Diagram (ERD)

## Scope & Schema Model

The HealthTech Knowledge Base data model supports:
- **Clinical Knowledge Base**: Articles with statuses (`draft`, `under_review`, `published`, `archived`), hierarchical categories, and many-to-many tags.
- **Editorial & Governance**: Rejection feedback, review queues, and reader satisfaction star ratings (`feedback`).
- **Identity & Access Management**: Users with hierarchical roles (`admin`, `editor`, `viewer`), verification status, and activity tracking.
- **Security & Administrative Auditing**: Non-repudiable audit logs (`audit_logs`) and search demand analytics (`search_logs`).
- **Conversational Decision Support**: Persisted chat logs and messages (`chat_logs`, `chat_messages`) with confidence scores, latency timing, source article citations, and helpfulness flags.

```mermaid
erDiagram
    USERS ||--o{ ARTICLES : authors
    USERS ||--o{ FEEDBACK : submits
    USERS ||--o{ AUDIT_LOGS : performs
    USERS ||--o{ SEARCH_LOGS : queries
    USERS ||--o{ CHAT_LOGS : initiates
    USERS ||--o{ MEDIA : uploads

    CATEGORIES ||--o{ CATEGORIES : parent_of
    CATEGORIES ||--o{ ARTICLES : categorizes

    ARTICLES ||--o{ ARTICLE_TAGS : labeled_with
    TAGS ||--o{ ARTICLE_TAGS : categorized_as
    ARTICLES ||--o{ FEEDBACK : receives
    ARTICLES ||--o{ MEDIA : attaches

    CHAT_LOGS ||--o{ CHAT_MESSAGES : contains

    USERS {
        int id PK
        string full_name
        string email UK
        string hashed_password
        string role "admin | editor | viewer"
        boolean is_active
        boolean is_verified
        int total_queries
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        int id PK
        string name
        string slug UK
        string description
        string icon
        int sort_order
        int parent_id FK "nullable, self-referencing"
        datetime created_at
        datetime updated_at
    }

    ARTICLES {
        int id PK
        string title
        string slug UK
        text content "Rich HTML"
        int category_id FK
        int author_id FK
        string status "draft | under_review | published | archived"
        int views
        string tags "comma-separated snapshot"
        text rejection_reason "nullable"
        datetime created_at
        datetime updated_at
    }

    TAGS {
        int id PK
        string name
        string slug UK
        datetime created_at
    }

    ARTICLE_TAGS {
        int article_id PK,FK
        int tag_id PK,FK
    }

    FEEDBACK {
        int id PK
        int article_id FK
        int user_id FK "nullable"
        int rating "1 to 5"
        text comment "nullable"
        string widget_host "nullable"
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK "nullable"
        string action "e.g. create_user, delete_article"
        string target_type "e.g. article, user, category"
        int target_id "nullable"
        text changes "JSON diff of changes"
        string ip_address "nullable"
        datetime created_at
    }

    SEARCH_LOGS {
        int id PK
        string query
        int results_count
        int user_id FK "nullable"
        string widget_host "nullable"
        datetime created_at
    }

    CHAT_LOGS {
        int id PK
        int user_id FK "nullable"
        string session_id UK
        string widget_source "nullable"
        datetime created_at
        datetime updated_at
    }

    CHAT_MESSAGES {
        int id PK
        int chat_log_id FK
        string sender "dashboard_user | hmis_widget | bot"
        text message
        boolean helpful "nullable, user feedback flag"
        string status "confident | low_confidence | fallback"
        float confidence "0.0 to 1.0"
        int response_time_ms "Monotonic execution time"
        text returned_article_ids "JSON array"
        datetime timestamp
    }

    MEDIA {
        int id PK
        string filename
        string file_path
        int file_size
        string mime_type
        int article_id FK "nullable"
        int uploaded_by FK
        datetime created_at
    }
```
