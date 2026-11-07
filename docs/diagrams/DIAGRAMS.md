# Academic Diagrams Specification
## Smart Banking Service Request Portal

---

## 1. System Architecture Diagram (Section 22)

```mermaid
graph TD
    subgraph Client_Layer["Client Tier (Browser)"]
        CustomerBrowser["Customer Browser<br>(HTML5 / CSS3 / Vanilla JS)"]
        AdminBrowser["Bank Officer Browser<br>(HTML5 / CSS3 / Vanilla JS)"]
    end

    subgraph Backend_Layer["Backend Tier (Node.js & Express REST API)"]
        Router["Express App & Routers"]
        Middleware["Auth Middleware (JWT & RBAC)<br>Multer Upload & Rate Limiter"]
        Controllers["Controllers<br>(Auth, Requests, Documents, Admin, Complaints, Transactions)"]
        Services["Business Services<br>(CloudinaryService, AIValidationService, NotificationService, ReportService)"]
    end

    subgraph Storage_AI_Layer["Cloud Services Tier"]
        DB[("Supabase-hosted PostgreSQL<br>(Relational Database)")]
        CloudinaryStorage["Cloudinary Protected Storage<br>(Document Assets)"]
        OpenRouterAI["OpenRouter API<br>(Vision AI Model)"]
    end

    CustomerBrowser -->|Fetch API / HTTPS| Router
    AdminBrowser -->|Fetch API / HTTPS| Router
    Router --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services -->|pg Pool SSL| DB
    Services -->|Signed Upload Stream| CloudinaryStorage
    Services -->|OpenAI-Compatible Chat API| OpenRouterAI
```

---

## 2. Entity Relationship Diagram (ERD — Exactly One, Section 18)

```mermaid
erDiagram
    users ||--o| customers : "profile"
    users ||--o| admins : "profile"
    users ||--o{ request_status_history : "changes"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "acts"
    users ||--o{ request_documents : "uploads"

    customers ||--o{ service_requests : "submits"
    customers ||--o{ complaints : "files"
    customers ||--o{ demo_transactions : "owns"

    admins ||--o{ service_requests : "assigned"
    admins ||--o{ complaints : "resolves"

    services ||--o{ service_document_requirements : "requires"
    services ||--o{ service_requests : "categorizes"
    document_types ||--o{ service_document_requirements : "defines"
    document_types ||--o{ request_documents : "classifies"

    service_requests ||--o{ request_documents : "contains"
    service_requests ||--o{ request_status_history : "tracks"
    service_requests ||--o{ notifications : "triggers"
    service_requests ||--o{ complaints : "referenced_in"

    request_documents ||--o{ ai_validations : "validated_by"
    complaints ||--o{ complaint_history : "tracks"
    complaints ||--o{ notifications : "triggers"

    users {
        int id PK
        string full_name
        string email UK
        string password_hash
        string role
        boolean is_active
        timestamp created_at
    }

    customers {
        int id PK
        int user_id FK
        string customer_reference UK
        string account_number
        string address
    }

    admins {
        int id PK
        int user_id FK
        string staff_reference UK
        string department
    }

    services {
        int id PK
        string service_code UK
        string name
        string description
        int processing_time_days
        boolean is_active
    }

    document_types {
        int id PK
        string name UK
        string description
    }

    service_document_requirements {
        int id PK
        int service_id FK
        int document_type_id FK
        boolean is_required
        string allowed_extensions
        numeric max_size_mb
    }

    service_requests {
        int id PK
        string request_number UK
        int customer_id FK
        int service_id FK
        string subject
        text details
        string status
        int assigned_admin_id FK
        timestamp created_at
    }

    request_documents {
        int id PK
        int request_id FK
        int document_type_id FK
        string cloudinary_public_id
        string secure_url
        string original_file_name
        string mime_type
        bigint file_size_bytes
        string verification_status
        string ai_validation_status
    }

    ai_validations {
        int id PK
        int request_document_id FK
        string model_id
        string readability_status
        string completeness_status
        boolean possible_mismatch
        numeric confidence
        jsonb issues
        text summary
        text recommendation
        text uncertainty_note
    }

    complaints {
        int id PK
        string complaint_number UK
        int customer_id FK
        int request_id FK
        string category
        string subject
        text details
        string status
        text resolution
    }

    demo_transactions {
        int id PK
        string transaction_reference UK
        int customer_id FK
        string account_number
        numeric amount
        string currency
        string transaction_type
        string monitoring_status
        text flag_reason
    }

    audit_logs {
        int id PK
        int actor_user_id FK
        string action
        string entity_type
        string entity_id
        jsonb details
        string ip_address
    }
```

---

## 3. DFD Level 0 — Context Diagram (Section 19)

```mermaid
graph TD
    Customer["Customer (External Entity)"]
    Admin["Bank Administrator (External Entity)"]
    CloudinaryStorage["Cloudinary Storage (External Entity)"]
    OpenRouterAI["OpenRouter AI (External Entity)"]

    System(("0 — Smart Banking Service<br>Request Portal"))

    Customer -->|Registration, Login, Service Request, Document Files, Complaints| System
    System -->|Request Status, Document Upload Confirmation, Notifications, Resolution| Customer

    Admin -->|Login Credentials, Review Verdicts, Remarks, Resolutions, Filter Queries| System
    System -->|Pending Requests, Document Previews, AI Reports, Transaction Feeds, Audits| Admin

    System -->|Document Upload Stream| CloudinaryStorage
    CloudinaryStorage -->|Asset Identifier & Secure Delivery URL| System

    System -->|Document Image & Review Prompt| OpenRouterAI
    OpenRouterAI -->|Structured JSON Validation Findings & Summary| System
```

---

## 4. DFD Level 1 — Main Process 1.0 (Section 20)

```mermaid
graph TD
    Customer["Customer"]
    Admin["Bank Officer"]
    Cloudinary["Cloudinary Storage"]
    OpenRouter["OpenRouter AI"]

    P1(("1.0 Customer & Service<br>Request Management"))

    D1[("D1 Users & Profiles")]
    D2[("D2 Services & Requirements")]
    D3[("D3 Service Requests")]
    D4[("D4 Request Documents Metadata")]
    D5[("D5 AI Validations")]
    D6[("D6 Request Status History")]
    D7[("D7 Notifications")]
    D8[("D8 Complaints")]
    D9[("D9 Demo Transactions")]
    D10[("D10 Audit Logs")]

    Customer -->|Credentials & Profile| P1
    Customer -->|Request Submission| P1
    Customer -->|Document Upload| P1
    Customer -->|Complaint| P1

    P1 -->|Status & Notifications| Customer

    Admin -->|Decisions & Remarks| P1
    Admin -->|Complaint Resolutions| P1
    Admin -->|Monitoring Updates| P1

    P1 -->|Queue, Documents & Reports| Admin

    P1 <-->|Read / Write| D1
    P1 <-->|Read Services| D2
    P1 <-->|Read / Write| D3
    P1 <-->|Read / Write| D4
    P1 <-->|Read / Write| D5
    P1 <-->|Read / Write| D6
    P1 <-->|Read / Write| D7
    P1 <-->|Read / Write| D8
    P1 <-->|Read / Write| D9
    P1 <-->|Write Logs| D10

    P1 -->|Upload File Stream| Cloudinary
    Cloudinary -->|Asset Metadata & URL| P1

    P1 -->|Inspection Request| OpenRouter
    OpenRouter -->|Structured Findings JSON| P1
```

---

## 5. DFD Level 2 — Sheet 1: Customer & Request Management (Section 21)

```mermaid
graph TD
    Customer["Customer"]
    
    P11(("1.1 Register & Authenticate"))
    P12(("1.2 View Profile & Services"))
    P13(("1.3 Enter & Validate Request"))
    P14(("1.4 Identify Required Docs"))
    P15(("1.5 Upload Doc & Cloudinary Ref"))
    P16(("1.6 Create Request & Num"))
    P17(("1.7 Track Request History"))
    P18(("1.8 Submit Complaint"))

    D1[("D1 Users / Customers")]
    D2[("D2 Services Catalogue")]
    D3[("D3 Service Requests")]
    D4[("D4 Request Documents")]
    D6[("D6 Status History")]
    D8[("D8 Complaints")]
    Cloudinary["Cloudinary Storage"]

    Customer --> P11
    P11 <--> D1
    Customer --> P12
    P12 <--> D2
    Customer --> P13
    P13 --> P14
    P14 <--> D2
    Customer --> P15
    P15 --> Cloudinary
    Cloudinary --> P15
    P15 --> D4
    P13 --> P16
    P16 --> D3
    P16 --> D6
    Customer --> P17
    P17 <--> D3
    P17 <--> D6
    Customer --> P18
    P18 --> D8
```

---

## 6. DFD Level 2 — Sheet 2: AI Validation & Admin Review (Section 21)

```mermaid
graph TD
    OpenRouter["OpenRouter AI Service"]
    Admin["Bank Officer"]

    P19(("1.9 Retrieve Authorized Doc"))
    P110(("1.10 Prepare Minimal Content"))
    P111(("1.11 Send Validation Call"))
    P112(("1.12 Validate AI Response"))
    P113(("1.13 Store AI Findings"))
    P114(("1.14 Display Request & Doc"))
    P115(("1.15 Record Remarks"))
    P116(("1.16 Issue Decision"))
    P117(("1.17 Update Status"))

    D3[("D3 Service Requests")]
    D4[("D4 Request Documents")]
    D5[("D5 AI Validations")]
    D6[("D6 Status History")]
    D10[("D10 Audit Logs")]

    D4 --> P19
    P19 --> P110
    P110 --> P111
    P111 --> OpenRouter
    OpenRouter --> P112
    P112 --> P113
    P113 --> D5

    D3 --> P114
    D4 --> P114
    D5 --> P114
    P114 --> Admin
    Admin --> P115
    P115 --> P116
    P116 --> P117
    P117 --> D3
    P117 --> D6
    P116 --> D10
```

---

## 7. DFD Level 2 — Sheet 3: Notifications, Monitoring & Reporting (Section 21)

```mermaid
graph TD
    Customer["Customer"]
    Admin["Bank Officer"]

    P118(("1.18 Detect Event"))
    P119(("1.19 Create Notification"))
    P120(("1.20 Deliver Notification"))
    P121(("1.21 Assign & Update Complaint"))
    P122(("1.22 Read Demo Transactions"))
    P123(("1.23 Apply Rules & Flag"))
    P124(("1.24 Aggregate Data"))
    P125(("1.25 Generate Reports"))
    P126(("1.26 Record Audit Log"))

    D3[("D3 Requests")]
    D7[("D7 Notifications")]
    D8[("D8 Complaints")]
    D9[("D9 Demo Transactions")]
    D10[("D10 Audit Logs")]

    D3 --> P118
    D8 --> P118
    P118 --> P119
    P119 --> D7
    D7 --> P120
    P120 --> Customer

    Admin --> P121
    P121 --> D8

    D9 --> P122
    P122 --> P123
    P123 --> D9
    P123 --> Admin

    D3 --> P124
    D8 --> P124
    D9 --> P124
    P124 --> P125
    P125 --> Admin

    Admin --> P126
    P126 --> D10
```

---

## 8. AI Human-in-the-Loop Workflow (Section 27)

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend
    participant Backend as Express Backend
    participant Storage as Cloudinary Storage
    participant AI as OpenRouter AI (Vision)
    actor Admin
    participant DB as Supabase PostgreSQL

    Customer->>Frontend: Select file and click Upload
    Frontend->>Backend: POST /api/requests/:id/documents (multipart)
    Backend->>Backend: Verify customer ownership, file extension & MIME
    Backend->>Storage: Stream buffer to Cloudinary (folder: Smart-Banking-...)
    Storage-->>Backend: Return public_id and secure_url
    Backend->>DB: Save document metadata (status: Uploaded, AI: Processing)
    Backend->>AI: POST /chat/completions (model, image_url, JSON prompt)
    AI-->>Backend: Return structured JSON (readability, completeness, confidence, issues)
    Backend->>Backend: Validate JSON types & sanitize
    Backend->>DB: Save record in ai_validations & set status to Completed
    Backend->>DB: Update request status to 'Pending Admin Review'
    Backend-->>Customer: Return upload success & AI queued status

    Note over Backend,Admin: Human-in-the-Loop Review
    Admin->>Frontend: Open Request Inspection Page
    Frontend->>Backend: GET /api/admin/requests/:id
    Backend->>DB: Fetch request, documents, and AI validation findings
    Backend-->>Frontend: Return application evidence + AI advisory report
    Admin->>Admin: Verify uploaded credentials against AI notes
    Admin->>Frontend: Enter remarks and select 'APPROVE' / 'REJECT' / 'CORRECTION_REQUIRED'
    Frontend->>Backend: POST /api/admin/requests/:id/decision
    Backend->>DB: Update request status, write status_history, log in audit_logs
    Backend->>DB: Dispatch customer in-app notification
    Backend-->>Frontend: Return decision success
```
