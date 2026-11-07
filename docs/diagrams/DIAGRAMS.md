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



---

## 9. Use Case Diagrams (Section 15 — All 9 Modules)

### 9.1 Authentication & Profile Management
```mermaid
graph LR
    subgraph SystemBoundary["Smart Banking Portal"]
        UC1((Register Account))
        UC2((Login with Credentials))
        UC3((Logout / Invalidate Token))
        UC4((View Profile))
        UC5((Update Contact Info))
        UC6((Admin Authenticated Access))
    end
    Customer((Customer)) --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Admin((Bank Officer)) --> UC6
    Admin --> UC3
```

### 9.2 Service Catalogue & Service Requests
```mermaid
graph LR
    subgraph SystemBoundary["Service Requests Engine"]
        UC7((View 10 Banking Services))
        UC8((Inspect Document Checklist))
        UC9((Create Service Request))
        UC10((Generate Request Number))
        UC11((Track Request Status))
        UC12((View Request History))
        UC13((Cancel Pending Request))
    end
    Customer((Customer)) --> UC7
    Customer --> UC8
    Customer --> UC9
    UC9 -.->|<<include>>| UC10
    Customer --> UC11
    Customer --> UC12
    Customer --> UC13
```

### 9.3 Document Management & Cloudinary Storage
```mermaid
graph LR
    subgraph SystemBoundary["Document Subsystem"]
        UC14((Select File for Request))
        UC15((Validate MIME & Size Limits))
        UC16((Upload to Cloudinary))
        UC17((Save PostgreSQL Metadata))
        UC18((Replace Correction File))
        UC19((Authorized Document Preview))
    end
    Customer((Customer)) --> UC14
    UC14 -.->|<<include>>| UC15
    UC15 -.->|<<include>>| UC16
    UC16 -.->|<<include>>| UC17
    Customer --> UC18
    Admin((Bank Officer)) --> UC19
```

### 9.4 AI-Assisted Document Validation
```mermaid
graph LR
    subgraph SystemBoundary["AI Vision Intelligence"]
        UC20((Prepare Minimal Document Payload))
        UC21((Invoke OpenRouter Vision API))
        UC22((Validate Structured Findings JSON))
        UC23((Store Validation Results))
        UC24((View AI Advisory Report))
        UC25((Retry Failed AI Validation))
    end
    SystemComponent((System Engine)) --> UC20
    UC20 -.->|<<include>>| UC21
    UC21 -.->|<<include>>| UC22
    UC22 -.->|<<include>>| UC23
    Admin((Bank Officer)) --> UC24
    Admin --> UC25
```

### 9.5 Admin Review & Human Decision
```mermaid
graph LR
    subgraph SystemBoundary["Administrative Decisioning"]
        UC26((View Pending Requests Queue))
        UC27((Inspect Document Evidence))
        UC28((Review AI Advisory Notes))
        UC29((Approve Request))
        UC30((Reject Request with Remarks))
        UC31((Request Document Correction))
        UC32((Record Decision Audit Log))
    end
    Admin((Bank Officer)) --> UC26
    Admin --> UC27
    Admin --> UC28
    Admin --> UC29
    Admin --> UC30
    Admin --> UC31
    UC29 -.->|<<include>>| UC32
    UC30 -.->|<<include>>| UC32
    UC31 -.->|<<include>>| UC32
```

### 9.6 Notifications Subsystem
```mermaid
graph LR
    subgraph SystemBoundary["Notification Service"]
        UC33((Detect State Change Event))
        UC34((Generate In-App Notification))
        UC35((View Unread Notifications))
        UC36((Mark Notification as Read))
    end
    SystemEngine((System Engine)) --> UC33
    UC33 -.->|<<include>>| UC34
    Customer((Customer)) --> UC35
    Customer --> UC36
```

### 9.7 Complaint Management
```mermaid
graph LR
    subgraph SystemBoundary["Complaints & Support"]
        UC37((Submit Dispute / Complaint))
        UC38((Track Complaint Resolution))
        UC39((Assign Complaint Officer))
        UC40((Update Status & Resolution))
    end
    Customer((Customer)) --> UC37
    Customer --> UC38
    Admin((Bank Officer)) --> UC39
    Admin --> UC40
```

### 9.8 Transaction Monitoring (Academic Demo)
```mermaid
graph LR
    subgraph SystemBoundary["Demo AML Monitoring"]
        UC41((Read Synthetic Seeded Transactions))
        UC42((Apply Rule-Based Flags))
        UC43((Inspect Flag Reasons))
        UC44((Update Monitoring Status))
    end
    SystemEngine((System Engine)) --> UC41
    UC41 -.->|<<include>>| UC42
    Admin((Bank Officer)) --> UC43
    Admin --> UC44
```

### 9.9 Reports & Audit Logs
```mermaid
graph LR
    subgraph SystemBoundary["Reporting & Auditing"]
        UC45((View Dashboard Metric Cards))
        UC46((Filter by Date, Service & Status))
        UC47((Generate Request & Service Reports))
        UC48((Inspect Security Audit Logs))
    end
    Admin((Bank Officer)) --> UC45
    Admin --> UC46
    Admin --> UC47
    Admin --> UC48
```

---

## 10. Activity Diagrams (Section 16 — Major Workflows)

### 10.1 Customer Registration & Login Workflow
```mermaid
flowchart TD
    Start([Customer Starts]) --> InputForm[Enter Registration Details]
    InputForm --> ValidateInput{Valid Email & Password?}
    ValidateInput -- No --> ShowError[Display Validation Error] --> InputForm
    ValidateInput -- Yes --> HashPass[Hash Password with bcrypt]
    HashPass --> SaveDB[(Insert into users & customers)]
    SaveDB --> LoginPrompt[Customer Enters Login Credentials]
    LoginPrompt --> CheckCreds{Credentials Match?}
    CheckCreds -- No --> BadLogin[Invalid Credentials Warning] --> LoginPrompt
    CheckCreds -- Yes --> IssueJWT[Generate Signed JWT Token]
    IssueJWT --> RedirectDash[Redirect to Customer Dashboard] --> Done([Session Active])
```

### 10.2 Service Selection & Request Submission
```mermaid
flowchart TD
    Start([Customer on Portal]) --> Browse[Browse 10 Banking Services]
    Browse --> Select[Select Service e.g. Account Opening]
    Select --> ViewDocs[Inspect Required Document Checklist]
    ViewDocs --> FillForm[Fill Subject & Request Details]
    FillForm --> Validate{All Mandatory Fields Present?}
    Validate -- No --> ErrorMsg[Show Incomplete Fields Alert] --> FillForm
    Validate -- Yes --> GenNumber[Generate Request Number SBR-2026-XXXXX]
    GenNumber --> SaveReq[(Insert service_requests with status: Submitted)]
    SaveReq --> Notify[Dispatch Customer Notification]
    Notify --> UploadPrompt[Prompt Supporting Document Upload] --> End([Request Ready])
```

### 10.3 Document Upload & Cloudinary Storage
```mermaid
flowchart TD
    Start([Upload Triggered]) --> SelectFile[Select File: JPG, PNG or PDF]
    SelectFile --> SizeCheck{File Size <= Configured Limit?}
    SizeCheck -- No --> RejectSize[Reject: File Exceeds Limit] --> SelectFile
    SizeCheck -- Yes --> MIMECheck{Allowed MIME Type?}
    MIMECheck -- No --> RejectMIME[Reject: Unsupported File Type] --> SelectFile
    MIMECheck -- Yes --> StreamCloudinary[Stream Upload Buffer to Cloudinary]
    StreamCloudinary --> CloudinaryResp{Upload Succeeded?}
    CloudinaryResp -- No --> RetryUpload[Return Storage Error] --> SelectFile
    CloudinaryResp -- Yes --> SaveMeta[(Save public_id & URL in request_documents)]
    SaveMeta --> QueueAI[Queue Document for AI Vision Validation] --> Done([Upload Complete])
```

### 10.4 AI-Assisted Document Validation Workflow
```mermaid
flowchart TD
    Start([Document Uploaded]) --> UpdateStatus[(Set ai_validation_status: Processing)]
    UpdateStatus --> PrepPayload[Prepare Secure URL & Structured JSON Schema]
    PrepPayload --> CallAI[POST Call to OpenRouter Vision Model]
    CallAI --> CheckAIResponse{HTTP 200 & Valid JSON?}
    CheckAIResponse -- No --> AIError[Log Provider Error & Set Status: Failed]
    AIError --> Fallback[Enable Manual Review Flag for Admin]
    CheckAIResponse -- Yes --> ValidateSchema[Verify readability, completeness, issues]
    ValidateSchema --> SaveAI[(Store findings in ai_validations table)]
    SaveAI --> UpdateReq[(Update request status to Pending Admin Review)]
    UpdateReq --> Done([Advisory Report Ready for Officer])
    Fallback --> Done
```

### 10.5 Admin Review, Correction, Approval & Rejection
```mermaid
flowchart TD
    Start([Admin Opens Request]) --> ViewEvidence[Inspect Customer Info, Files & AI Notes]
    ViewEvidence --> HumanDecision{Officer Decision?}
    HumanDecision -- Approve --> EnterApproveRemarks[Enter Approval Remarks]
    EnterApproveRemarks --> SetApproved[(Update status: Approved / Completed)]
    HumanDecision -- Correction Required --> EnterFixRemarks[Specify Document Needing Re-upload]
    EnterFixRemarks --> SetCorrection[(Update status: Correction Required)]
    HumanDecision -- Reject --> EnterRejectRemarks[Enter Formal Reason for Rejection]
    EnterRejectRemarks --> SetRejected[(Update status: Rejected)]
    SetApproved --> LogAudit[(Record in audit_logs & status_history)]
    SetCorrection --> LogAudit
    SetRejected --> LogAudit
    LogAudit --> DispatchNotification[Send Immediate In-App Alert to Customer]
    DispatchNotification --> End([Review Concluded])
```

---

## 11. Swimlane Diagrams (Section 17 — Major Workflows)

### 11.1 Document Upload, Cloudinary Storage & AI Review Swimlane
```mermaid
flowchart LR
    subgraph Customer["Customer Lane"]
        C1[Select File & Submit]
        C2[View Upload Progress]
        C3[Receive Status Update]
    end

    subgraph Backend["Express API Backend Lane"]
        B1[Verify User & Ownership]
        B2[Check Extension, MIME & Size]
        B3[Stream File to Cloudinary]
        B4[Save Metadata in Database]
        B5[Call OpenRouter Vision API]
        B6[Validate Structured Findings]
        B7[Notify Admin & Customer]
    end

    subgraph CloudinaryStorage["Cloudinary Storage Lane"]
        S1[Receive Image Stream]
        S2[Store in Protected Folder]
        S3[Return public_id & Secure URL]
    end

    subgraph OpenRouter["OpenRouter AI Lane"]
        A1[Receive Image & Rules Prompt]
        A2[Perform Vision Inspection]
        A3[Return Structured JSON Findings]
    end

    subgraph Database["Supabase PostgreSQL Lane"]
        D1[(Save request_documents)]
        D2[(Save ai_validations)]
        D3[(Update service_requests status)]
    end

    C1 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> B4
    B4 --> D1
    B4 --> B5
    B5 --> A1
    A1 --> A2
    A2 --> A3
    A3 --> B6
    B6 --> D2
    D2 --> D3
    D3 --> B7
    B7 --> C3
```

### 11.2 Admin Review and Decision Swimlane
```mermaid
flowchart LR
    subgraph AdminLane["Bank Administrator Lane"]
        AD1[Open Admin Queue]
        AD2[Inspect Request & Preview Docs]
        AD3[Review AI Uncertainty Report]
        AD4[Submit Decision & Remarks]
    end

    subgraph BackendLane["Express Backend Lane"]
        BK1[Authorize Admin Role]
        BK2[Fetch Application Details & Evidence]
        BK3[Validate Decision Input]
        BK4[Persist Status & Create Audit Entry]
        BK5[Trigger Customer Notification]
    end

    subgraph DBLane["Supabase PostgreSQL Lane"]
        DB1[(Query Requests, Documents & AI)]
        DB2[(Update service_requests status)]
        DB3[(Insert request_status_history)]
        DB4[(Insert audit_logs)]
        DB5[(Insert notifications queue)]
    end

    subgraph CustomerLane["Customer Lane"]
        CU1[Receive In-App Notification]
        CU2[View Updated Application Status]
    end

    AD1 --> BK1
    BK1 --> BK2
    BK2 --> DB1
    DB1 --> BK2
    BK2 --> AD2
    AD2 --> AD3
    AD3 --> AD4
    AD4 --> BK3
    BK3 --> BK4
    BK4 --> DB2
    BK4 --> DB3
    BK4 --> DB4
    BK4 --> DB5
    DB5 --> BK5
    BK5 --> CU1
    CU1 --> CU2
```
