# SMART BANKING SERVICE REQUEST PORTAL
## Complete Practicum Project Blueprint and 60-Day Logbook Plan

**Project title:** Smart Banking Service Request Portal with AI-Assisted Document Validation  
**Duration:** 3 months / 12 weeks / 60 working days  
**Frontend:** HTML, CSS, Vanilla JavaScript  
**Backend:** Node.js, Express.js  
**Database:** Supabase-hosted PostgreSQL  
**Document/image storage:** Cloudinary  
**AI provider:** OpenRouter API

> **How to use this pack:** The daily entries are written in logbook-ready English. Use each entry only after completing the corresponding work, and change the wording if your actual work was different. Do not record a task as completed before doing it. The weekly evaluation page is for the university supervisor to complete/rate; use the weekly topic and progress summary to support that review, and leave the supervisor's rating/signature to the supervisor.

**Contents:** Project Definition • Roles and Requirements • Architecture and Supabase Database Setup • Diagram Plan • API and Security • Master Coding Prompt • AI System Prompt • 60 Daily Entries • 12 Weekly Evaluation Notes • Final Checklist

---

# Part A — Complete Project Definition

## 1. Project Overview

The Smart Banking Service Request Portal is a web-based academic practicum system where customers can request selected banking services online, submit required supporting documents, track request progress, receive notifications, and raise complaints. Administrators can manage customer requests, review documents, see AI-assisted validation results, request corrections, approve or reject requests, manage complaints, monitor sample transaction records, and view reports.

The system is a **practicum prototype**, not a live bank-core system. It will use demonstration or synthetic customer/document/transaction data. It will not connect to real bank accounts, initiate real transfers, process card payments, or make credit/financial eligibility decisions.

AI is used for assistance only. The AI can indicate whether a document image appears readable or incomplete, list possible inconsistencies, and summarize a request. **It must never make the final approval/rejection decision or claim that a person committed fraud. A human administrator must review the evidence and make the final decision.**

## 2. Project Objectives

1. Provide customers with an easy online portal for banking service requests.
2. Allow customers to upload required document images/files and associate them with a specific request.
3. Store document files in Cloudinary and keep document metadata/references in Supabase-hosted PostgreSQL.
4. Use OpenRouter to call an appropriate vision-capable model for AI-assisted document review when image analysis is needed.
5. Provide an administrative portal to review requests, documents, AI output, and customer corrections.
6. Maintain request status history and provide customer notifications.
7. Provide complaint management, simulated transaction monitoring, audit logs, and reports.
8. Apply basic secure-development practices and test the end-to-end workflow.
9. Prepare the diagrams and documentation required for the practicum.

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5 | Page structure and forms |
| Styling | CSS3 | Responsive banking UI, layout, tables, badges, dialogs |
| Frontend logic | Vanilla JavaScript + Fetch API | Form validation and API calls |
| Backend | Node.js | Server-side JavaScript runtime |
| API framework | Express.js | REST endpoints, middleware, routing |
| Database | Supabase-hosted PostgreSQL | Managed PostgreSQL database for users, services, requests, metadata, status history, notifications, and reports data |
| File storage | Cloudinary | Store uploaded images/documents and return asset identifiers/URLs |
| AI | OpenRouter API | AI-assisted document review and request summary |
| Authentication | bcrypt + JWT or secure server-side sessions | Password hashing and authenticated access |
| Validation | express-validator or equivalent | Validate request payloads |
| Security | Helmet, restricted CORS, rate limiting, authorization middleware | Safer API defaults |
| Testing | Node test runner/Jest + Supertest or equivalent | API and integration tests |
| Documentation | README, API docs, diagram files | Setup and practicum documentation |

### Database hosting decision: Supabase

Use **Supabase as the hosted database platform**. The underlying relational database remains PostgreSQL, so the project uses normal PostgreSQL tables, SQL, constraints, indexes, foreign keys, and the Node.js `pg` driver from the Express backend. Create a Supabase project, copy the database connection string from the Supabase Dashboard's **Connect** panel, and place it in the backend `.env` as `DATABASE_URL`. Keep the password and connection string on the server only; never put them in frontend JavaScript or a public repository. Enable SSL. Select a direct connection or the appropriate Supabase pooler connection according to where the backend is hosted and the host's IPv4/IPv6 support. Do not assume Supabase Auth is being used: this blueprint keeps authentication in the Express backend with bcrypt and JWT/session handling unless the implementation is deliberately changed.

OpenRouter offers an OpenAI-compatible API endpoint at `https://openrouter.ai/api/v1`; model identifiers and capabilities differ, so the implementation must select and test a model that supports the required image input rather than assuming all models can inspect images. See the official developer platform: https://openrouter.ai/developers. Cloudinary supports private and authenticated delivery types; sensitive uploaded documents should not be left publicly accessible by default. See https://cloudinary.com/documentation/control_access_to_media and https://cloudinary.com/documentation/image_upload_api_reference.

## 4. User Roles / Actors

### 4.1 Customer
- Register and log in.
- Manage basic profile information.
- View available banking-service categories and required documents.
- Create, submit, and view service requests.
- Upload documents for a request.
- View the document-upload and AI-review status.
- Track request status and status history.
- View notifications.
- Submit and track complaints.

### 4.2 Admin
- Log in through protected admin access.
- View dashboard statistics.
- Search and filter customers and requests.
- Review service request details and submitted documents.
- View AI-assisted document analysis and uncertainty notes.
- Add remarks and request corrections.
- Approve/reject requests or mark them as needing correction.
- Update request status and maintain status history.
- Manage complaints and their resolution.
- Review simulated/seeded transaction-monitoring records.
- View reports and audit history.

### 4.3 AI Validation Service
- Receive only the information/document content needed for the specific analysis.
- Return structured assistance such as readability, apparent completeness, possible mismatch, issues, short summary, and recommendation.
- Clearly express uncertainty and avoid unsupported conclusions.
- Never change a request status to Approved or Rejected by itself.

### 4.4 Notification Service
- Create in-app notifications when a request is submitted, its status changes, correction is needed, or a complaint is updated.
- Track whether a notification has been read.
- Optionally support email notifications if configured; in-app notifications are the baseline feature.

## 5. Banking Service Categories

Implement these as configurable demo services:
1. Account Opening Request
2. Account Information Update
3. Debit/Credit Card Request
4. Card Replacement Request
5. Cheque Book Request
6. Internet Banking Activation
7. Mobile Banking Service Request
8. Loan Service Inquiry (inquiry/request workflow only, no credit decision)
9. KYC / Document Verification
10. Fund Transfer Query (query/complaint only, no actual transfer)

Each service should have its own required-document checklist configurable through the database or admin settings. Use sample documents in development and testing.

## 6. Main Functional Modules

### Module A — Authentication and Profile
- Customer registration and login.
- Protected customer and admin routes.
- Password hashing.
- Role-based access control.
- Profile view/update.
- Logout and expired-token/session handling.

### Module B — Service Catalogue and Request Management
- Display active services and descriptions.
- Show the required documents for the selected service.
- Validate the request form.
- Create a request number, for example `SBR-2026-00001`.
- Track current status and full status history.
- Provide request detail and request history pages.

### Module C — Document Management with Cloudinary
- Allow only configured file types and size limits.
- Accept required document images and supported files.
- Upload through a trusted backend/signed flow.
- Store files in a private/authenticated Cloudinary delivery mode when available and appropriate.
- Store Cloudinary asset identifiers, public IDs, URLs/secure URLs, file metadata, and status in Supabase-hosted PostgreSQL.
- Never store Cloudinary API secret or OpenRouter key in browser JavaScript.
- Check file ownership and request ownership before allowing downloads/previews.
- Allow replacement of a document when correction is requested.

### Module D — AI-Assisted Document Validation
- Run only after a customer has uploaded a document and the backend has checked its type/size/access permissions.
- For image analysis, use an OpenRouter model that explicitly supports vision/image input. For PDFs, use an appropriate supported route such as server-side text extraction or page-to-image conversion before sending limited required content; do not assume every selected model accepts PDF files.
- Send only necessary data; use synthetic/redacted samples during development.
- Ask for structured JSON with document type, readability, apparent completeness, possible mismatch, confidence, issues, summary, recommendation, and uncertainty.
- Validate the response in backend code before saving it.
- Store model identifier, timestamp, result fields, and error status, not unnecessary copies of sensitive content.
- Provide a retry/error state if the provider is unavailable.
- Display AI output as an assistant result for admin review, not a verified truth.

### Module E — Admin Review and Decision
- Pending request queue.
- Request detail page.
- Document preview/download through access-controlled links.
- AI result and warning display.
- Admin remarks.
- Approve, reject, or request correction.
- Require a reason/remark for rejection or correction.
- Record who changed the status and when.
- Prevent non-admin users from accessing administrative operations.

### Module F — Notifications
- In-app notification list.
- Unread count and mark-as-read.
- Submission, correction, approval, rejection, status update, and complaint updates.
- Notification history tied to the user and relevant request/complaint.

### Module G — Complaint Management
- Customer submits complaint and optional related request.
- Admin sees queue, category, status, and details.
- Admin adds response, changes status, and records resolution.
- Customer tracks complaint history and receives update notifications.

### Module H — Transaction Monitoring (Academic Demo)
- Use seeded/synthetic transaction records only.
- Show transaction amount/category/status and simple rule-based flags for demo purposes.
- Allow admin to inspect and change a monitoring status.
- Do not claim that this prototype detects actual financial crime or connects to bank transactions.

### Module I — Reporting and Audit
- Dashboard counts: customers, submitted/pending/approved/rejected requests, document reviews, open complaints, and demo flagged transactions.
- Filters by date, service type, and request status.
- Export report as CSV if time permits.
- Audit log for important administrative events.

## 7. Suggested Frontend Pages

### Customer Portal
- `login.html`
- `register.html`
- `dashboard.html`
- `profile.html`
- `services.html`
- `service-request.html`
- `requests.html`
- `request-details.html`
- `documents.html` (or a document section inside request details)
- `notifications.html`
- `complaints.html`
- `complaint-details.html`

### Admin Portal
- `admin-login.html`
- `admin-dashboard.html`
- `admin-customers.html`
- `admin-services.html`
- `admin-requests.html`
- `admin-request-details.html`
- `admin-documents.html`
- `admin-complaints.html`
- `admin-transactions.html`
- `admin-reports.html`
- `admin-audit-logs.html`
- `admin-settings.html`

Use the supplied UI screenshots as inspiration for layout and information hierarchy, but create an original responsive design. Include sidebar navigation, active navigation state, dashboard statistic cards, tables, search and filters, status badges, forms, loading and empty states, toast messages, confirmation dialogs, and responsive behavior for mobile screens.

## 8. Functional Requirements (FR)

- **FR-01:** The system shall allow customers to register and log in.
- **FR-02:** The system shall enforce role-based access for customers and admins.
- **FR-03:** Customers shall be able to view active banking services.
- **FR-04:** Customers shall be able to submit a request for a selected service.
- **FR-05:** The system shall generate a unique request number.
- **FR-06:** The system shall display the required documents for each service.
- **FR-07:** Customers shall be able to upload permitted document files.
- **FR-08:** Uploaded files shall be stored in Cloudinary, with their metadata stored in Supabase-hosted PostgreSQL.
- **FR-09:** The system shall validate file type and size on the server.
- **FR-10:** The system shall support AI-assisted document analysis through OpenRouter when configured.
- **FR-11:** The backend shall validate AI outputs and store the result/status.
- **FR-12:** Customers shall be able to see request status and history.
- **FR-13:** Admins shall be able to review requests and documents.
- **FR-14:** Admins shall be able to approve, reject, or request correction, with remarks.
- **FR-15:** Every status change shall create a history entry.
- **FR-16:** The system shall create in-app notifications for key events.
- **FR-17:** Customers shall be able to submit and track complaints.
- **FR-18:** Admins shall be able to manage complaint status and resolution.
- **FR-19:** Admins shall be able to inspect demo transaction-monitoring records.
- **FR-20:** The dashboard shall show statistics derived from database records.
- **FR-21:** Important admin actions shall be written to an audit log.
- **FR-22:** Users shall only access their own requests/documents unless they are authorized admins.

## 9. Non-Functional Requirements (NFR)

- **Security:** Password hashes, protected routes, least privilege, server-side authorization, secure secrets.
- **Privacy:** Use synthetic/test data during development; protect uploaded personal documents and minimize data sent to AI.
- **Reliability:** Clear error handling for database, file storage, and AI-provider failures.
- **Usability:** Simple forms, understandable status labels, helpful error messages, and responsive design.
- **Performance:** Pagination for large tables, indexed foreign keys/status/date fields, and no unnecessary duplicate API calls.
- **Maintainability:** Separate routes, controllers, services, repositories, validators, and configuration.
- **Scalability:** Keep modules independent and centralize configuration.
- **Auditability:** Record important status decisions with actor, time, and remarks.
- **Accessibility:** Labels for inputs, keyboard-operable controls, visible focus states, and sufficient contrast.

## 10. System Statuses

Use one consistent set across the database, backend, frontend, diagrams, and logbook:

`Draft` → `Submitted` → `Document Review` → `AI Validation` → `Pending Admin Review` → one of `Correction Required`, `Approved`, or `Rejected`. Approved requests may then move to `Completed`. A customer may cancel only according to a documented rule, such as before final admin decision.

Avoid having frontend and backend use different spellings of the same status. Every change must be added to `request_status_history`.

## 11. System Architecture and Data Storage

```text
Customer / Admin Browser
          |
          | HTML, CSS, JavaScript + Fetch API
          v
Node.js + Express REST API
   |              |                 |
   |              |                 |
   v              v                 v
Supabase-hosted PostgreSQL     Cloudinary        OpenRouter API
Structured     Protected         AI-assisted image/text
application    document files    analysis and summaries
records
```

**Supabase-hosted PostgreSQL stores:** user/profile records, service catalogue, requests, document metadata, AI result fields, status history, notifications, complaints, demo transactions, and audit logs.  
**Cloudinary stores:** uploaded file assets. Supabase-hosted PostgreSQL stores the asset identifier/public ID and relevant metadata. A public URL should not be treated as secure access control.  
**OpenRouter processes:** only the limited document content or extracted information needed for the AI assistance feature. Keep its API key in the backend environment.

### Recommended document upload flow
1. Customer selects a file for a particular request and document type.
2. Frontend sends the file to the protected backend endpoint.
3. Backend verifies the logged-in user owns the request, checks size/extension/MIME/signature, and applies upload limits.
4. Backend uploads the file to a protected Cloudinary delivery mode where supported.
5. Backend stores asset ID/public ID, file metadata, request ID, document type, and status in Supabase-hosted PostgreSQL.
6. Backend returns safe metadata to the frontend; it does not expose Cloudinary API secret.
7. Admin access to a document is checked on the backend and uses a time-limited/signed delivery mechanism where configured.

### Recommended AI flow
1. User upload and file checks complete.
2. Backend prepares the minimum content needed for review; use redacted or synthetic data for development.
3. If image analysis is used, call a model known to support image input; do not assume every model supports it.
4. Backend requests structured output and parses/validates types and ranges.
5. Store the result and error/status metadata.
6. Display the result with a clear label: **AI-assisted result — human review required**.
7. Admin independently reviews the document and makes the final decision.

## 12. Suggested Supabase PostgreSQL Tables and Relationships

The final schema may be refined during implementation, but the ERD and actual database must stay consistent.

### 12.1 `users`
- `id` — primary key
- `full_name`
- `email` — unique
- `phone` — optional, unique only if policy requires
- `password_hash`
- `role` — `CUSTOMER` or `ADMIN`
- `is_active`
- `created_at`, `updated_at`

### 12.2 `customers`
- `id` — primary key
- `user_id` — foreign key to `users.id`, unique
- `customer_reference` — generated internal reference
- `address` — optional demo profile field
- `created_at`, `updated_at`

### 12.3 `admins`
- `id` — primary key
- `user_id` — foreign key to `users.id`, unique
- `staff_reference`
- `created_at`

### 12.4 `services`
- `id` — primary key
- `service_code` — unique
- `name`, `description`
- `is_active`
- `created_at`, `updated_at`

### 12.5 `document_types`
- `id` — primary key
- `name`
- `description`
- `created_at`

### 12.6 `service_document_requirements`
- `id` — primary key
- `service_id` — foreign key to `services.id`
- `document_type_id` — foreign key to `document_types.id`
- `is_required`
- `allowed_extensions`
- `max_size_mb`
- Unique constraint on service/document type as appropriate

### 12.7 `service_requests`
- `id` — primary key
- `request_number` — unique human-readable number
- `customer_id` — foreign key to `customers.id`
- `service_id` — foreign key to `services.id`
- `subject`, `details`
- `status`
- `assigned_admin_id` — nullable foreign key to `admins.id`
- `submitted_at`, `created_at`, `updated_at`

### 12.8 `request_documents`
- `id` — primary key
- `request_id` — foreign key to `service_requests.id`
- `document_type_id` — foreign key to `document_types.id`
- `cloudinary_public_id` or asset identifier
- `cloudinary_resource_type`, `delivery_type`
- `secure_url` or URL reference (protected; do not assume public delivery)
- `original_file_name`, `mime_type`, `file_size_bytes`
- `verification_status`, `ai_validation_status`
- `uploaded_by_user_id` — foreign key to `users.id`
- `created_at`, `updated_at`

### 12.9 `ai_validations`
- `id` — primary key
- `request_document_id` — foreign key to `request_documents.id`
- `model_id`
- `readability_status`, `completeness_status`, `possible_mismatch`
- `confidence` — decimal between 0 and 1 where available
- `issues` — JSONB or related child table
- `summary`, `recommendation`, `uncertainty_note`
- `validation_status`, `error_code` (when applicable)
- `created_at`

### 12.10 `request_status_history`
- `id` — primary key
- `request_id` — foreign key to `service_requests.id`
- `old_status`, `new_status`
- `changed_by_user_id` — foreign key to `users.id`
- `remarks`
- `created_at`

### 12.11 `notifications`
- `id` — primary key
- `user_id` — foreign key to `users.id`
- `request_id` — nullable foreign key to `service_requests.id`
- `complaint_id` — nullable foreign key to `complaints.id` (created after complaints table, or add constraint later)
- `title`, `message`, `channel`, `is_read`
- `created_at`, `sent_at`

### 12.12 `complaints`
- `id` — primary key
- `customer_id` — foreign key to `customers.id`
- `request_id` — nullable foreign key to `service_requests.id`
- `category`, `subject`, `details`, `status`
- `assigned_admin_id` — nullable foreign key to `admins.id`
- `resolution`
- `created_at`, `updated_at`

### 12.13 `complaint_history`
- `id` — primary key
- `complaint_id` — foreign key to `complaints.id`
- `changed_by_user_id` — foreign key to `users.id`
- `old_status`, `new_status`, `remarks`
- `created_at`

### 12.14 `demo_transactions`
- `id` — primary key
- `transaction_reference` — unique demo reference
- `customer_id` — nullable foreign key to `customers.id`
- `amount`, `currency`, `transaction_type`, `transaction_status`
- `monitoring_status`, `flag_reason`
- `created_at`

### 12.15 `audit_logs`
- `id` — primary key
- `actor_user_id` — nullable foreign key to `users.id`
- `action`, `entity_type`, `entity_id`
- `details` — carefully minimized JSONB metadata
- `created_at`

**Relationship summary:** One user may map to one customer profile or one admin profile. One customer can create many service requests and complaints. One service can be used by many requests and has several required-document rules. One request can have many uploaded documents, status-history records, and notifications. A document can have many AI validation runs. One complaint can have many complaint-history entries. Admin actions can be captured in audit logs. Reports should generally be calculated from these tables rather than storing duplicate totals.

## 13. Requirement Engineering Deliverables

Create an SRS with these sections:
1. Introduction and purpose
2. Project scope
3. Definitions and abbreviations
4. Stakeholders and user roles
5. Functional requirements (FR-01 to FR-22)
6. Non-functional requirements
7. Use-case descriptions and preconditions/postconditions
8. Business rules and request-status rules
9. Data requirements and database constraints
10. AI assumptions, limitations, and human review requirements
11. Security/privacy requirements
12. Error handling and external service dependencies
13. Acceptance criteria

### Example acceptance criteria
- A customer cannot view another customer's request or document.
- A non-admin cannot call an admin approval endpoint successfully.
- A request cannot be submitted if mandatory fields/documents are missing.
- Unsupported file types and files exceeding the configured limit are rejected server-side.
- A successful upload produces a Supabase-hosted PostgreSQL metadata record with the correct request/document relationship.
- AI output is schema-validated before saving.
- AI cannot approve or reject a request.
- Every admin decision records the actor, timestamp, old/new status, and remarks.
- The customer can see a status update and corresponding notification.

---

# Part B — Complete Diagram Plan

## 14. Diagram Count — Final and Fixed

The following count is the agreed structure:

| Diagram | Required count | Scope |
|---|---:|---|
| Use Case Diagrams | One per major module/part | Authentication, Service Request, Document Management, AI Validation, Admin Review, Notifications, Complaints, Transaction Monitoring, Reporting |
| Activity Diagrams | One per major workflow | At least the same major workflows listed below |
| Swimlane Diagrams | One per major workflow | Show responsibility across Customer, System, Cloudinary, AI, Admin, Notification Service where relevant |
| ERD | **1** | Whole database and relationships |
| DFD Level 0 | **1** | Whole system as a single context process |
| DFD Level 1 | **1** | One main process only: 1.0 Customer & Service Request Management |
| DFD Level 2 | **3** | Three detailed functional sheets for Process Group 1, Process Group 2, and Process Group 3, all nested under Level 1 process 1.0 |

**DFD total = 5 diagrams:** one Level 0 + one Level 1 + three Level 2 detail sheets. Level 1 contains only one main process (1.0); all three detail sheets organize the sub-processes within that process. Do not create extra DFD diagrams unless the supervisor specifically asks for them.

## 15. Use Case Diagrams — Each Major Part

Create separate diagrams (or clearly separated diagrams) for:
1. **Authentication & Profile:** Customer Register, Login, Logout, View/Update Profile; Admin Login.
2. **Service Catalogue & Request:** View Services, View Required Documents, Create Request, Submit Request, View Request, Track Status, View History, Cancel under defined rules.
3. **Document Management:** Upload Document, Validate File, View Upload Status, Replace for Correction; Admin View Document, Download via authorized access, Mark Review Status.
4. **AI Validation:** Start Validation, Return Structured Result, View Issues/Summary; Admin View AI Result and Retry Failed Validation when authorized.
5. **Admin Review:** View Queue, Open Request, Review Document, Add Remarks, Request Correction, Approve, Reject, Update Status.
6. **Notifications:** Receive Notification, View Notifications, Mark as Read; System Create Notification.
7. **Complaint Management:** Submit Complaint, Track Complaint, View Reply; Admin Assign, Review, Update, Resolve Complaint.
8. **Transaction Monitoring:** Admin View Demo Transactions, View Flag Reason, Update Monitoring Status.
9. **Reports & Audit:** Admin View Dashboard, Filter Reports, Export CSV (optional), View Audit Log.

Represent external actors and system boundaries consistently. Do not show the AI actor as approving a request. Use `<<include>>` or `<<extend>>` only where their meaning is clear and necessary.

## 16. Activity Diagrams — Each Major Workflow

Create a separate Activity Diagram for:
1. Customer registration/login.
2. Service selection and request submission.
3. Required-document checking and Cloudinary upload.
4. OpenRouter AI-assisted document validation.
5. Admin review, correction request, approval, and rejection.
6. Request status tracking.
7. Notification creation and delivery.
8. Complaint submission and resolution.
9. Demo transaction monitoring.
10. Report generation.

Include Start/End, actions, decision branches, error paths, and retry/correction paths. Make sure every diagram matches actual application behaviour and the request statuses.

## 17. Swimlane Diagrams — Each Major Workflow

Use lanes selected from these participants: **Customer, Frontend, Backend/System, Supabase-hosted PostgreSQL, Cloudinary, OpenRouter AI, Admin, Notification Service**.

Required swimlanes:
1. Registration/login.
2. Service request submission.
3. Document upload and storage.
4. AI-assisted validation.
5. Admin review and decision.
6. Correction and resubmission.
7. Notification and customer tracking.
8. Complaint handling.
9. Demo transaction monitoring and report viewing.

Only show lanes participating in a particular workflow; do not place every participant in every diagram if they do not take part.

## 18. ERD — Exactly One

Create one full ERD that covers the tables described in Section 12. Show primary keys, foreign keys, one-to-one and one-to-many cardinalities, and optional relationships. Use the same table/column names in the ERD and the actual Supabase-hosted PostgreSQL schema. Do not create a separate ERD per module; the agreed requirement is one ERD for the entire system.

## 19. DFD Level 0 — Exactly One Context Diagram

Draw one single process labelled **0 — Smart Banking Service Request Portal**.

External entities:
- Customer
- Admin
- OpenRouter AI Service
- Cloudinary File Storage
- Notification/Email Service (email optional; in-app notification is internal)

Show data entering/leaving the system, such as customer registration/request/document metadata, request status inquiries, admin decisions, document analysis request/result, upload/download request/asset reference, and notification content/status. For a context diagram, keep the system as a single process; do not decompose it into internal processes or overload it with database tables.

## 20. DFD Level 1 — Exactly One Diagram with One Main Process

Create **one DFD Level 1 diagram containing only one main process**. Do not place three separate top-level processes on this diagram.

### **1.0 Customer & Service Request Management**

This single process is the first major process from the agreed three-part outline: **Customer & Service Request Management**. It represents the customer request lifecycle and its connected supporting steps, including authentication, required documents, Cloudinary upload, AI validation, admin review, status changes, notifications, complaint handling, demo transaction monitoring, and reporting. Do not add the former Process 2.0 or Process 3.0 as separate boxes on Level 1; their detailed functions belong in the three Level 2 detail sheets.

External entities / services to show where relevant:
- Customer
- Admin
- Cloudinary File Storage
- OpenRouter AI Service
- Optional Email Provider (in-app notifications are handled internally)

Suggested data stores used inside process flows:
- **D1 Users / Customers / Admins**
- **D2 Services and Document Requirements**
- **D3 Service Requests**
- **D4 Request Document Metadata and Cloudinary References**
- **D5 AI Validation Results**
- **D6 Request Status History**
- **D7 Notifications**
- **D8 Complaints and Complaint History**
- **D9 Synthetic Demo Transactions**
- **D10 Audit Logs**

The single process exchanges credentials, profiles, service requests, document metadata, status inquiries, AI analysis requests/results, admin decisions, complaint information, notification events, demo monitoring data, and report requests/results with the appropriate external entities. Supabase-hosted PostgreSQL is the database implementation for D1-D10; Cloudinary and OpenRouter are external services, not database stores. Never draw direct data-store-to-data-store flows; all data must pass through a process.

## 21. DFD Level 2 — Exactly Three Detailed Process Diagrams

For the requested presentation, create **three separate DFD Level 2 detail diagrams** covering the three functional areas below. These are three detail sheets for the single Level 1 process 1.0; they are not three extra processes on Level 1. Keep external entities, data stores, input/output names, and flows consistent with DFD Level 0 and Level 1.

### DFD Level 2 — Process Detail 1: Customer & Service Request Management

Sub-processes:
- **1.1** Register/Login and Authenticate User
- **1.2** Manage Profile and View Services
- **1.3** Enter and Validate Request Details
- **1.4** Identify Required Documents
- **1.5** Upload Document and Store Cloudinary Metadata Reference
- **1.6** Create Request and Generate Request Number
- **1.7** Track Request and Read Status History
- **1.8** Submit Complaint

Key flows: Customer credentials/profile/request fields/files → backend validation → user/service/request data stores; upload handling calls Cloudinary and stores asset metadata/reference in D4; customer tracking reads D3/D6; complaint submission stores data in D8. Include Supabase-hosted PostgreSQL as the backing database for the logical data stores.

### DFD Level 2 — Process Detail 2: AI Validation & Admin Review

Sub-processes (numbered as functional steps within the single Level 1 process):
- **1.9** Retrieve Authorized Document Reference
- **1.10** Prepare Minimal Document Content for Analysis
- **1.11** Send Validation Request to OpenRouter
- **1.12** Receive and Validate Structured AI Response
- **1.13** Store AI Result and Error Status
- **1.14** Display Request and Document to Admin
- **1.15** Record Admin Review and Remarks
- **1.16** Approve, Reject, or Request Correction
- **1.17** Update Request Status and Status History

Key flows: D4 document metadata/reference → authorized retrieval and preparation; the limited prepared content → external OpenRouter entity; AI response → backend schema/type validation; result → D5; human admin decision → D3/D6 and audit log D10. The AI result is advisory only. A failed AI call must lead to a recorded error/manual-review path, never an automatic rejection or approval.

### DFD Level 2 — Process Detail 3: Notification, Monitoring & Reporting

Sub-processes (numbered as functional steps within the single Level 1 process):
- **1.18** Detect a Request/Complaint/Status Event
- **1.19** Create Notification Record
- **1.20** Deliver or Queue Notification
- **1.21** Assign and Update Complaint
- **1.22** Read Synthetic Demo Transaction Records
- **1.23** Apply Demo Monitoring Rules and Flag Records
- **1.24** Aggregate Request/Complaint/Transaction Data
- **1.25** Generate Report and Dashboard Statistics
- **1.26** Record Important Admin Action in Audit Log

Key flows: request/status and complaint events → notification records D7 and complaint history D8; notifications → customer notification list and optional email provider; D9 demo records → monitoring process → flagged demo status; D3/D6/D8/D9 → reporting aggregates → admin dashboard; important admin actions → D10. Transaction monitoring uses synthetic records only, not live bank feeds.

**Numbering note:** The Level 1 drawing intentionally has only process **1.0**, as requested. The three Level 2 sheets group its detailed sub-processes into customer/request, AI/admin, and notification/monitoring/reporting areas. The sub-process numbers therefore remain under 1.0 (1.1–1.26) instead of suggesting that three Level 1 processes exist.

## 22. System Architecture Diagram

Create one high-level architecture diagram showing:
- Customer browser and Admin browser.
- HTML/CSS/JavaScript frontend.
- Express REST API backend.
- Authentication/authorization middleware.
- Controllers/business services/repositories.
- Supabase-hosted PostgreSQL, accessed only through the Express backend via a secure connection string.
- Cloudinary protected document storage.
- OpenRouter AI service.
- In-app notification module and optional email provider.

Also create an AI workflow diagram and a document-storage workflow diagram as supplementary architecture documentation. These are not additional DFD Level 2 diagrams; they are separate architecture/sequence/flow diagrams.

---

# Part C — Suggested Backend and API Structure

## 23. Suggested Project Folder Structure

```text
smart-banking-portal/
  frontend/
    assets/
      css/
      js/
      images/
    customer/
    admin/
    login.html
    register.html
  backend/
    src/
      config/
        database.js
        cloudinary.js
        aiClient.js
      controllers/
      routes/
      middleware/
      services/
        cloudinaryService.js
        aiValidationService.js
        notificationService.js
        reportService.js
      repositories/
      validators/
      utils/
      app.js
      server.js
    sql/
      schema.sql
      seed.sql
    tests/
    .env.example
    package.json
  docs/
    SRS.md
    API.md
    DATABASE.md
    TEST-PLAN.md
    diagrams/
      use-cases/
      activities/
      swimlanes/
      erd/
      dfd-level-0/
      dfd-level-1/
      dfd-level-2-process-1/
      dfd-level-2-process-2/
      dfd-level-2-process-3/
      architecture/
  README.md
```

## 24. Suggested REST API Endpoints

### Authentication and Profile
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `PATCH /api/me`

### Services and Requests
- `GET /api/services`
- `GET /api/services/:serviceId/requirements`
- `POST /api/requests`
- `GET /api/requests`
- `GET /api/requests/:requestId`
- `GET /api/requests/:requestId/history`
- `POST /api/requests/:requestId/cancel` (if allowed by business rule)

### Documents and AI
- `POST /api/requests/:requestId/documents`
- `GET /api/requests/:requestId/documents`
- `POST /api/documents/:documentId/validate-ai`
- `GET /api/documents/:documentId/ai-results`
- `POST /api/documents/:documentId/replace` (or an appropriately designed update endpoint)

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/customers`
- `GET /api/admin/requests`
- `GET /api/admin/requests/:requestId`
- `POST /api/admin/requests/:requestId/decision`
- `PATCH /api/admin/requests/:requestId/status`
- `GET /api/admin/documents/:documentId/access` (server authorizes and then returns a short-lived preview/access response)

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`

### Complaints
- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/complaints/:complaintId`
- `GET /api/admin/complaints`
- `PATCH /api/admin/complaints/:complaintId`

### Monitoring and Reporting
- `GET /api/admin/demo-transactions`
- `PATCH /api/admin/demo-transactions/:transactionId`
- `GET /api/admin/reports/requests`
- `GET /api/admin/reports/complaints`
- `GET /api/admin/reports/monitoring`
- `GET /api/admin/audit-logs`

Always authorize resource access on the backend; do not rely only on hiding buttons in the frontend.

## 25. Example Environment Variables

```text
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace_with_a_long_random_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=provider/model-that-supports-required-input
APP_BASE_URL=http://localhost:5000
```

Use `.env` locally and `.env.example` with placeholders in the repository. Add `.env` to `.gitignore`. Do not copy real credentials into frontend files, screenshots, reports, or a public Git repository.

## 26. Security and Privacy Checklist

- Hash passwords; never store plain passwords.
- Use server-side authentication and enforce role/resource ownership in middleware/controllers.
- Validate every input on the server; use parameterized SQL queries.
- Restrict CORS to the intended origin during deployment; use rate limits for login/upload/AI routes.
- Add upload size and file-type checks; do not trust the file extension alone.
- Keep Cloudinary assets containing customer documents private/authenticated where supported; avoid public delivery for IDs or bank-related papers. Generate access on the server only after authorization.
- Never expose Cloudinary API secret or OpenRouter key to the browser.
- Minimize document content sent to the AI provider; use synthetic/redacted data for tests and explain external processing in the demo/privacy note.
- Handle AI result as untrusted output; validate JSON fields, bounds, and missing values.
- Log admin decisions and important security events without storing raw passwords, tokens, or unnecessary personal document content.
- Use HTTPS in production.
- Use sample-only transaction records; never imply a live bank integration.
- Do not request or store a customer's card PIN, CVV, full payment-card credentials, or online-banking password.

---

# Part D — Copy-and-Paste Master Prompt for an AI Coding Agent

Use the following prompt in your coding assistant. Work phase by phase and test each phase before moving on. Do not ask it to produce the whole codebase in one unreviewed response.

```text
You are a senior full-stack software engineer and software architect. Build a complete academic practicum project named:

"Smart Banking Service Request Portal with AI-Assisted Document Validation"

This is a 3-month practicum-level project. It must be modular, responsive, database-driven, documented, testable, and substantial enough to demonstrate requirements engineering, UML/DFD modeling, frontend development, backend development, database design, third-party storage integration, AI integration, security, and testing.

TECHNOLOGY CONSTRAINTS
- Frontend: HTML5, CSS3, Vanilla JavaScript, Fetch API. Do not use React.
- Backend: Node.js and Express.js.
- Database: Supabase-hosted PostgreSQL, using the PostgreSQL engine with a normalized schema, foreign keys, indexes, constraints, and parameterized SQL.
- File/image storage: Cloudinary.
- AI provider: OpenRouter API.
- Authentication: bcrypt password hashing with secure JWT/session handling and role-based access control.
- Use Supabase as the managed PostgreSQL host. Connect with `pg` from Express using `DATABASE_URL` copied from the Supabase Dashboard Connect panel. Keep the database connection string, OpenRouter key, and Cloudinary API secret on the backend in environment variables; enable SSL and never expose these values in frontend code.

PROJECT BOUNDARIES
This is an academic prototype and must use synthetic/demo data. Do not connect to a real bank core, perform real fund transfers, make loan/credit decisions, or store card PIN/CVV/full card credentials. Transaction monitoring must use seeded demo transactions only.

USER ROLES
1. Customer
2. Admin
3. AI Validation Service (external service actor)
4. Notification Service (in-app notification, with optional configured email)

CUSTOMER FEATURES
- Register, login, logout, profile management.
- View banking services and each service's required documents.
- Submit service requests and receive a unique request number.
- Upload required files/documents against a specific request.
- View upload state and AI-assisted analysis state.
- Track request status and complete status history.
- View request history and in-app notifications.
- Submit and track complaints.

DEMO BANKING SERVICES
1. Account Opening Request
2. Account Information Update
3. Debit/Credit Card Request
4. Card Replacement Request
5. Cheque Book Request
6. Internet Banking Activation
7. Mobile Banking Service Request
8. Loan Service Inquiry only; no eligibility decision
9. KYC / Document Verification
10. Fund Transfer Query only; no actual transfer

ADMIN FEATURES
- Protected admin login and dashboard.
- Customer search and view.
- Service catalogue and required-document configuration.
- Request queues, filters, search, pagination, and detailed review.
- Access-controlled document preview.
- AI validation result review.
- Add remarks and request correction.
- Approve, reject, or request correction. Require remarks for rejection/correction.
- Every decision updates request status, status history, and audit log.
- Complaint assignment/review/update/resolution.
- View and update seeded demo transaction-monitoring records.
- Reports and dashboard statistics.

DOCUMENT / CLOUDINARY REQUIREMENTS
- Backend must verify authenticated user, request ownership, allowed file extension, actual content/MIME, size limit, and document type before upload.
- Use Cloudinary server-side or secure signed uploads. Never expose CLOUDINARY_API_SECRET.
- Use private/authenticated delivery for sensitive documents where supported. Do not assume a public CDN URL is private. Generate short-lived/signed access only after backend authorization.
- Store the Cloudinary asset identifier/public ID, delivery type/resource type, filename, MIME type, size, document type, request ID, uploader, upload date, and document status in Supabase-hosted PostgreSQL.
- Do not store file binary in Supabase-hosted PostgreSQL.
- For document replacement, keep appropriate history or mark the prior upload as superseded instead of silently losing the audit trail.

AI / OPENROUTER REQUIREMENTS
- Call OpenRouter from the backend only through https://openrouter.ai/api/v1.
- Use a configured model that actually supports the required image input; test selected-model capabilities at implementation time. Do not assume every model accepts images or PDFs.
- If PDF inputs are not supported by the selected route/model, extract needed text or convert PDF pages to images server-side before analysis, with file size/page limits.
- Use synthetic/redacted documents for development demonstrations. Minimize personally identifiable information sent to the external AI provider.
- Request structured JSON with fields: documentType, readabilityStatus, completenessStatus, possibleMismatch, confidence (0 to 1 when returned), issues, summary, recommendation, uncertaintyNote.
- Validate the AI response on the backend. Handle malformed response, timeout, rate limit, model unavailable, and provider error. Store error status and permit admin manual review.
- Do not claim the AI verifies identity or detects fraud with certainty. It can only provide assistance and point out apparent issues.
- AI must never approve/reject a request or change request status by itself. Final decision always belongs to an authorized human admin.
- Add an AI request-summary action for admin review.

REQUEST STATUS VALUES
Use a consistent controlled set: Draft, Submitted, Document Review, AI Validation, Pending Admin Review, Correction Required, Approved, Rejected, Completed, and optional Cancelled under a defined rule. Keep frontend labels, database values, APIs, and diagrams consistent. Record every transition in request_status_history.

REQUIRED FRONTEND PAGES
Customer: login, register, dashboard, profile, services, service-request, requests, request-details, documents, notifications, complaints, complaint-details.
Admin: admin-login, admin-dashboard, admin-customers, admin-services, admin-requests, admin-request-details, admin-documents, admin-complaints, admin-transactions, admin-reports, admin-audit-logs, admin-settings.

DESIGN REQUIREMENTS
Use the supplied banking dashboard screenshots as inspiration, but create an original UI. Use a clean professional banking layout, sidebar navigation, dashboard cards, clear status badges, tables, search/filters, forms, modal/confirmation dialogs, toast feedback, loading states, empty/error states, and responsive mobile layouts. Do not leave buttons nonfunctional or put all logic in a single HTML file.

DATABASE TABLES
Create a normalized schema for Supabase-hosted PostgreSQL:
users, customers, admins, services, document_types, service_document_requirements, service_requests, request_documents, ai_validations, request_status_history, notifications, complaints, complaint_history, demo_transactions, audit_logs.
Use primary/foreign keys, unique constraints, suitable indexes, timestamps, and seed/demo data. Keep the ERD and schema consistent. Store Cloudinary asset references and metadata, not actual files. Store AI result fields, model ID, and validation status.

BACKEND STRUCTURE
Use clear folders for config, controllers, routes, middleware, services, repositories, validators, utils, tests, and SQL. Separate database access, Cloudinary logic, AI logic, notification logic, and report logic. Implement centralized error handling and validation.

API MODULES
Authentication/profile, services, requests, documents, AI validation, admin review/decisions, notifications, complaints, demo transaction monitoring, reports, audit logs.
Provide REST endpoints with authorization middleware and correct status codes. Use parameterized queries only. Paginate/filter list endpoints. Enforce resource ownership on the server.

DIAGRAMS AND ACADEMIC DOCUMENTATION
Create docs/SRS.md, docs/API.md, docs/DATABASE.md, docs/TEST-PLAN.md, and docs/diagrams/.
Create Use Case Diagrams for Authentication/Profile, Service Request, Document Management, AI Validation, Admin Review, Notifications, Complaints, Transaction Monitoring, and Reports.
Create Activity Diagrams for registration/login, request submission, document upload, AI validation, admin decision, tracking, notification, complaint, transaction monitoring, and reporting.
Create Swimlane Diagrams for the same major workflows using only the relevant actors/lanes.
Create exactly ONE full ERD for the entire database.
Create exactly ONE DFD Level 0 context diagram.
Create exactly ONE DFD Level 1 with exactly ONE main process: 1.0 Customer & Service Request Management. Do not place three main process boxes on Level 1.
Create exactly THREE DFD Level 2 detail diagrams (three detail sheets for process 1.0): (1) Customer & Service Request Management, (2) AI Validation & Admin Review, and (3) Notification, Monitoring & Reporting. Number all detailed sub-processes under 1.0 as 1.1 through 1.26; the three detail sheets are functional groupings, not three additional Level 1 processes. Do not add more Level 2 diagrams unless explicitly requested.
Create one high-level system architecture diagram plus separate AI workflow and Cloudinary document-storage flow diagrams. These supplementary diagrams do not change the DFD count.
Use accurate notation and make Level 1 flows balance with Level 0. Show external services as external entities, not internal Supabase-hosted PostgreSQL data stores. Do not draw direct data-store-to-data-store flows; use processes.

SECURITY
Hash passwords, protect routes, validate all user input, use parameterized SQL, restrict CORS, use safe upload validation, rate-limit sensitive endpoints, keep secrets out of source control, avoid public delivery of sensitive files, minimize AI data sharing, and keep audit logs. Never store plain passwords, access tokens, PINs, or CVVs.

TESTING
Create unit/integration tests for auth, resource ownership, role access, file validation, database relationships, request status transitions, malformed AI output, AI provider outage, notifications, complaints, reports, and admin decisions. Include negative tests. Do not mark a test as passed until it has actually been run.

DEVELOPMENT RULES
Work phase-by-phase, not as one giant code dump:
1. Requirements/SRS and architecture.
2. Diagrams and database design.
3. Supabase project setup, PostgreSQL schema, and seed data.
4. Express foundation and error handling.
5. Authentication and roles.
6. Customer/service request frontend and APIs.
7. Cloudinary document uploads and access control.
8. OpenRouter AI validation and structured-output handling.
9. Admin portal and human-reviewed decisions.
10. Notifications and complaint management.
11. Demo transaction monitoring, reports, and audit logs.
12. Security hardening, testing, bug fixes, README, final documentation.

For every phase:
- First explain scope and files to create/change.
- Implement in coherent small steps.
- Run relevant tests and report actual results.
- Fix errors before continuing.
- Keep existing features working.
- Update diagrams/docs when the data flow changes.
- Provide setup commands, .env.example, schema.sql, seed.sql, and README instructions.

Do not claim a feature, test, deployment, or integration is complete unless it has actually been implemented and checked. Aim for a working, understandable practicum application rather than an oversized untested code dump.
```

## 27. AI System Prompt for the Backend

Use this as the basis of the prompt sent to OpenRouter. The backend should also validate the output using code/schema validation.

```text
You are an AI-assisted document review component for an academic Smart Banking Service Request Portal. You support a human administrator and do not make decisions on behalf of the bank.

Analyze only the supplied document image or limited extracted information and return a structured result with:
- documentType
- readabilityStatus: readable, partially_readable, unreadable, or unknown
- completenessStatus: appears_complete, appears_incomplete, or unknown
- possibleMismatch: true, false, or unknown
- confidence: a number from 0 to 1 only if the model can provide a meaningful estimate; otherwise null
- issues: a list of specific observable issues
- summary: a short factual summary
- recommendation: a cautious next step for a human reviewer
- uncertaintyNote: limitations or details that cannot be verified

Rules:
1. Do not invent missing fields or facts.
2. Do not claim to authenticate a person's identity, confirm a document is genuine, or determine fraud.
3. A visual inconsistency is only a possible issue requiring a human check.
4. If text is unclear, say that it is unclear rather than guessing.
5. Do not recommend approval or rejection as a final decision. Use language such as "send for manual review" or "request a clearer copy if needed".
6. Return valid JSON only in the agreed schema.
7. The human admin makes the final decision.
```

---

# Part E — 60-Day Daily Logbook Entries

Each entry below contains the two fields used on the Daily Evaluation page: **Activities** and **New Skill Learned**. Update the past-tense wording to match work actually completed on that day.

## Week 1 — Project Orientation and Requirement Engineering

### Day 1
**Activities:** Introduced the Smart Banking Service Request Portal practicum project, reviewed its objectives and scope, and identified the expected customer and administrator workflows.  
**New Skill Learned:** Understanding project scope and planning a software development practicum.

### Day 2
**Activities:** Identified the project stakeholders and user roles, including Customer, Admin, AI Validation Service, and Notification Service, and documented their responsibilities.  
**New Skill Learned:** Stakeholder identification and role analysis.

### Day 3
**Activities:** Collected and organized functional requirements for registration, service selection, request submission, document upload, request tracking, admin review, and notifications.  
**New Skill Learned:** Functional requirement elicitation and documentation.

### Day 4
**Activities:** Identified non-functional requirements related to security, privacy, usability, performance, reliability, maintainability, and access control.  
**New Skill Learned:** Non-functional requirement analysis.

### Day 5
**Activities:** Prepared the initial Software Requirements Specification (SRS), defined the project boundaries, and documented assumptions and acceptance criteria.  
**New Skill Learned:** SRS preparation and acceptance-criteria writing.

## Week 2 — Use Case Modeling

### Day 6
**Activities:** Analyzed the customer authentication and profile workflow and prepared a Use Case Diagram for registration, login, logout, and profile management.  
**New Skill Learned:** UML actor and use-case modeling.

### Day 7
**Activities:** Analyzed the service catalogue and customer request workflow, including service selection, required-document viewing, request submission, and request tracking.  
**New Skill Learned:** Use Case modeling for customer-facing business processes.

### Day 8
**Activities:** Prepared Use Case Diagrams for document management and AI-assisted validation, showing customer actions, system responsibilities, and administrator access.  
**New Skill Learned:** Modeling external services and system boundaries in UML.

### Day 9
**Activities:** Prepared the Admin Review Use Case Diagram for document review, AI-result review, remarks, correction requests, approval, rejection, and status updates.  
**New Skill Learned:** Modeling administrative workflows and decision permissions.

### Day 10
**Activities:** Prepared Use Case Diagrams for notifications, complaint management, demo transaction monitoring, and reporting, then reviewed naming consistency across diagrams.  
**New Skill Learned:** Modular use-case documentation and diagram consistency checking.

## Week 3 — Activity and Swimlane Diagrams

### Day 11
**Activities:** Designed the Activity Diagram for customer registration and login, including input validation, invalid credentials, and successful dashboard access.  
**New Skill Learned:** Modeling decision branches and exception paths in Activity Diagrams.

### Day 12
**Activities:** Designed the Activity Diagram for service selection and request submission, including required fields, request-number generation, and submission confirmation.  
**New Skill Learned:** Business-process workflow modeling.

### Day 13
**Activities:** Designed the Activity Diagram and Swimlane Diagram for document upload, backend file checks, Cloudinary storage, and Supabase-hosted PostgreSQL metadata creation.  
**New Skill Learned:** Modeling interactions between the frontend, backend, file storage, and database.

### Day 14
**Activities:** Designed Activity and Swimlane Diagrams for AI-assisted document validation and admin review, showing AI errors, manual review, correction, and final administrator decisions.  
**New Skill Learned:** Modeling human-in-the-loop AI workflows.

### Day 15
**Activities:** Prepared the remaining major Swimlane Diagrams for request tracking, notifications, complaint handling, demo transaction monitoring, and reporting.  
**New Skill Learned:** Responsibility mapping across multiple system actors.

## Week 4 — DFD and System Architecture

### Day 16
**Activities:** Identified the system's external entities, data stores, processes, data inputs, and outputs before drawing the Data Flow Diagrams.  
**New Skill Learned:** DFD notation and data-flow identification.

### Day 17
**Activities:** Created the single DFD Level 0 context diagram for the Smart Banking Service Request Portal and reviewed external data exchanges.  
**New Skill Learned:** Context-level system modeling.

### Day 18
**Activities:** Created the single DFD Level 1 diagram with only one main process, 1.0 Customer & Service Request Management, as required by the agreed diagram structure.  
**New Skill Learned:** System decomposition and Level 1 DFD balancing.

### Day 19
**Activities:** Created the first DFD Level 2 detail sheet for customer and service-request management, covering authentication, service selection, request creation, document handling, tracking, and complaint submission.  
**New Skill Learned:** Level 2 DFD decomposition and process numbering.

### Day 20
**Activities:** Created the second and third DFD Level 2 detail sheets for AI/admin review and notification/monitoring/reporting, then checked that the set contained one Level 0, one Level 1, and three Level 2 diagrams.  
**New Skill Learned:** DFD consistency checking and process-to-process data-flow mapping.

## Week 5 — ERD and Supabase PostgreSQL Database Design

### Day 21
**Activities:** Identified database entities and attributes for users, customers, admins, services, requests, documents, AI validations, status history, notifications, complaints, transactions, and audit logs, planning Supabase as the managed database platform.  
**New Skill Learned:** Entity and attribute identification for relational databases.

### Day 22
**Activities:** Prepared one complete ERD for the whole system, defining primary keys, foreign keys, and relationships among the main entities, ready for implementation in Supabase-hosted PostgreSQL.  
**New Skill Learned:** ERD design and cardinality modeling.

### Day 23
**Activities:** Reviewed normalization, relationship constraints, nullable fields, unique values, and indexes, then aligned the ERD with the proposed Supabase-hosted PostgreSQL schema.  
**New Skill Learned:** Relational database normalization and integrity constraints.

### Day 24
**Activities:** Created the Supabase project, opened its database connection settings, configured the Supabase-hosted PostgreSQL connection string in the backend environment, enabled SSL, and tested connectivity from Node.js.  
**New Skill Learned:** Supabase project setup, connection-string configuration, and secure Node.js database connectivity.

### Day 25
**Activities:** Created the initial SQL schema in Supabase-hosted PostgreSQL and added seed data for users, services, document requirements, requests, request documents, and related supporting tables.  
**New Skill Learned:** SQL schema creation, Supabase database management, foreign keys, constraints, and seed data preparation.

## Week 6 — UI/UX and Frontend Development

### Day 26
**Activities:** Reviewed the supplied banking UI references and prepared page layouts, navigation structure, color choices, reusable components, and responsive behavior for the customer and admin portals.  
**New Skill Learned:** UI/UX planning and dashboard information architecture.

### Day 27
**Activities:** Developed the customer registration, login, and profile pages using HTML and CSS, adding form labels, validation messages, and responsive layout rules.  
**New Skill Learned:** Building accessible forms with HTML and responsive CSS.

### Day 28
**Activities:** Developed the customer dashboard with service shortcuts, request summary cards, recent activity, notification count, and navigation links.  
**New Skill Learned:** Dashboard layout and reusable frontend components.

### Day 29
**Activities:** Developed the service catalogue and service-request form, including service selection, required-document checklist, form validation, and submission feedback.  
**New Skill Learned:** JavaScript form handling and client-side validation.

### Day 30
**Activities:** Developed the request list, request-detail, and status-tracking interfaces, including request number, current status, submission date, and status history display.  
**New Skill Learned:** Rendering dynamic request data with JavaScript.

## Week 7 — Express Backend and Authentication

### Day 31
**Activities:** Initialized the Node.js and Express.js backend and organized the code into routes, controllers, middleware, services, repositories, validators, and configuration modules.  
**New Skill Learned:** Modular backend architecture and REST API design.

### Day 32
**Activities:** Connected Express.js to the Supabase-hosted PostgreSQL database using the project connection string, configured the pg connection pool and SSL, and tested parameterized queries.  
**New Skill Learned:** Supabase PostgreSQL integration and safer SQL query handling.

### Day 33
**Activities:** Implemented customer registration and login with password hashing, input validation, and protected authentication handling.  
**New Skill Learned:** Password hashing and backend authentication implementation.

### Day 34
**Activities:** Implemented authentication/authorization middleware, role checks, profile endpoints, and service-catalogue endpoints for customer and administrator roles.  
**New Skill Learned:** Role-based access control and protected REST routes.

### Day 35
**Activities:** Implemented service-request APIs for creation, retrieval, request-number generation, status updates, and request-status history.  
**New Skill Learned:** CRUD operations and business-rule implementation in Express.js.

## Week 8 — Cloudinary Document Storage and OpenRouter AI

### Day 36
**Activities:** Integrated Cloudinary with the backend and implemented document upload handling, server-side file validation, and storage of Cloudinary asset metadata in Supabase-hosted PostgreSQL.  
**New Skill Learned:** Third-party file-storage integration and upload validation.

### Day 37
**Activities:** Connected uploaded documents to their service requests, implemented required-document checks, and added access-control checks for customer-owned requests and administrator review.  
**New Skill Learned:** File metadata management and resource-ownership validation.

### Day 38
**Activities:** Configured the OpenRouter API client and environment variables, then tested a basic backend request using a selected model suitable for the intended input type.  
**New Skill Learned:** Secure third-party AI API configuration.

### Day 39
**Activities:** Implemented the AI validation service module, prepared prompts for document readability and completeness analysis, and handled provider responses and failures.  
**New Skill Learned:** AI prompt design and external API error handling.

### Day 40
**Activities:** Added structured AI-result parsing and backend validation for document type, readability, completeness, possible mismatch, issues, confidence where available, summary, and uncertainty notes.  
**New Skill Learned:** Structured AI response handling and output validation.

## Week 9 — Admin Portal and Request Decisions

### Day 41
**Activities:** Developed the protected admin login and dashboard layouts, showing pending requests, document-review counts, complaint counts, and other demo statistics.  
**New Skill Learned:** Admin-dashboard design and protected-page implementation.

### Day 42
**Activities:** Developed customer-management screens with search, filters, pagination, and authorized access to relevant customer profile information.  
**New Skill Learned:** Dynamic tables, pagination, and data filtering.

### Day 43
**Activities:** Developed the admin request queue and request-detail page, including service type, current status, submission date, request information, and request history.  
**New Skill Learned:** Building admin review queues and request-detail interfaces.

### Day 44
**Activities:** Integrated document previews and AI-assisted results into the admin review page, keeping document access protected and clearly labelling AI results as advisory.  
**New Skill Learned:** Integrating file review with AI decision-support information.

### Day 45
**Activities:** Implemented admin approval, rejection, correction requests, remarks, status-history entries, and audit-log records, with server-side role checks.  
**New Skill Learned:** Implementing controlled business decisions and audit trails.

## Week 10 — Notifications and Complaint Management

### Day 46
**Activities:** Implemented in-app notification creation for request submission, status changes, approval, rejection, and correction-required events.  
**New Skill Learned:** Event-driven notification logic.

### Day 47
**Activities:** Developed the customer notification page with unread counts, notification history, and mark-as-read functionality.  
**New Skill Learned:** Managing notification state and frontend/backend synchronization.

### Day 48
**Activities:** Implemented customer complaint submission and tracking, including complaint category, description, related request, status, and history.  
**New Skill Learned:** Complaint form development and case tracking.

### Day 49
**Activities:** Developed the admin complaint-management workflow for reviewing complaints, assigning responsibility, adding remarks, updating status, and recording resolution.  
**New Skill Learned:** Administrative case-management workflow implementation.

### Day 50
**Activities:** Implemented the demo transaction-monitoring section using seeded sample records, simple flags, monitoring status, and admin review actions.  
**New Skill Learned:** Building a rule-based monitoring interface using demo data.

## Week 11 — Reports, Security, and AI Improvement

### Day 51
**Activities:** Developed report endpoints and dashboard summaries for request status, service categories, complaint status, and demo transaction-monitoring results.  
**New Skill Learned:** SQL aggregation and dashboard reporting.

### Day 52
**Activities:** Added search, date filters, status filters, sorting, and pagination to major admin tables and tested combinations of filter parameters.  
**New Skill Learned:** Efficient data filtering and paginated API design.

### Day 53
**Activities:** Reviewed application security, improved input validation, access checks, upload restrictions, rate limiting, environment-secret handling, and error responses.  
**New Skill Learned:** Secure coding and security testing fundamentals.

### Day 54
**Activities:** Refined the AI validation prompt and error handling so the system clearly reports uncertainty and does not make final approval, rejection, or fraud claims.  
**New Skill Learned:** Prompt refinement and human-in-the-loop AI design.

### Day 55
**Activities:** Added an AI-generated request summary for administrators and checked that the summary, validation result, and recommendation are stored and displayed as advisory information.  
**New Skill Learned:** Integrating AI-generated summaries into an administrative workflow.

## Week 12 — Testing, Fixes, and Final Documentation

### Day 56
**Activities:** Prepared and ran tests for registration, login, role authorization, Supabase PostgreSQL operations, request creation, and document upload validation.  
**New Skill Learned:** Unit testing and API integration testing.

### Day 57
**Activities:** Tested AI response parsing, OpenRouter failure handling, admin decisions, status history, notifications, complaint updates, and access restrictions with positive and negative test cases.  
**New Skill Learned:** Scenario-based testing and negative test design.

### Day 58
**Activities:** Fixed identified UI, API, database, file-access, and workflow errors, then reran the affected tests to check for regressions.  
**New Skill Learned:** Debugging, regression testing, and defect resolution.

### Day 59
**Activities:** Performed end-to-end testing of the customer-to-admin request journey and reviewed the consistency of the ERD, SQL schema, status flows, and DFDs.  
**New Skill Learned:** End-to-end system verification and documentation consistency review.

### Day 60
**Activities:** Finalized the README, API and database documentation, test report, diagrams, and project demonstration, and prepared the final practicum presentation.  
**New Skill Learned:** Technical documentation, project demonstration, and final review.

---

# Part F — 12 Weekly Supervisor Evaluation Notes

The third logbook page is a **University Supervisor Evaluation** form. The supervisor should provide the ratings and signatures. The entries below are suggested weekly topics and progress summaries that can help align the 12 evaluation forms with the 12-week project plan; they are not pre-filled supervisor ratings.

## Week 1
**Topic:** Project Introduction and Requirement Engineering  
**Progress summary:** Project scope, stakeholders, functional requirements, non-functional requirements, and initial SRS were prepared.

## Week 2
**Topic:** Use Case Modeling  
**Progress summary:** Use Case Diagrams were prepared for authentication, customer service requests, document management, AI validation, admin review, notifications, complaints, monitoring, and reports.

## Week 3
**Topic:** Activity and Swimlane Diagrams  
**Progress summary:** Major workflows were modeled with decision paths, error paths, actor responsibilities, and interactions among the customer, system, storage, AI, admin, and notification components.

## Week 4
**Topic:** Data Flow Diagrams and System Architecture  
**Progress summary:** One DFD Level 0, one DFD Level 1 with only the single 1.0 main process, and three Level 2 functional detail sheets were completed and checked for consistent flows.

## Week 5
**Topic:** ERD and Supabase PostgreSQL Database Design  
**Progress summary:** One complete ERD was prepared, and the normalized schema for Supabase-hosted PostgreSQL, relationships, constraints, indexes, and seed records were developed.

## Week 6
**Topic:** Frontend UI/UX Development  
**Progress summary:** Customer authentication, dashboard, service catalogue, request form, and request-tracking interfaces were developed using HTML, CSS, and JavaScript.

## Week 7
**Topic:** Backend API and Authentication  
**Progress summary:** The Express backend, Supabase PostgreSQL connection, authentication, role checks, service endpoints, request creation, and status-history logic were implemented.

## Week 8
**Topic:** Cloudinary and OpenRouter Integration  
**Progress summary:** Document upload/storage metadata handling and AI-assisted validation integration were developed with server-side checks and error handling.

## Week 9
**Topic:** Admin Portal and Request Review  
**Progress summary:** Admin request queues, document review, AI-result display, administrator remarks, approval/rejection/correction paths, and audit records were implemented.

## Week 10
**Topic:** Notification and Complaint Management  
**Progress summary:** In-app notifications, complaint submission/tracking, admin complaint resolution, and demo transaction monitoring were developed.

## Week 11
**Topic:** Reporting, Security, and AI Refinement  
**Progress summary:** Dashboard reports, table filters, security improvements, AI prompt refinements, and an AI-assisted request-summary feature were added.

## Week 12
**Topic:** Testing and Final Documentation  
**Progress summary:** Functional and integration tests were run, detected defects were fixed, the full workflow was checked, and final documentation and demonstration materials were prepared.

**Form fields such as supervisor name, student name/ID, organization, ratings, comments, and signatures must be completed according to the actual practicum and supervisor's assessment.**

---

# Part G — Final Consistency Checklist

Before final submission, verify that:

- [ ] Project title is consistent everywhere.
- [ ] The stack is HTML/CSS/JavaScript + Node.js/Express + Supabase-hosted PostgreSQL + Cloudinary + OpenRouter.
- [ ] The project is clearly described as a practicum prototype with synthetic/demo records.
- [ ] Requirement Engineering includes all actors/roles and both functional/non-functional requirements.
- [ ] Use Case Diagrams cover all nine major modules.
- [ ] Activity Diagrams cover all major workflows and error/decision branches.
- [ ] Swimlane Diagrams show the responsible actors in each workflow.
- [ ] There is exactly one ERD for the whole database.
- [ ] There is exactly one DFD Level 0.
- [ ] There is exactly one DFD Level 1 containing only the single main process 1.0 Customer & Service Request Management.
- [ ] There are exactly three DFD Level 2 detail sheets for customer/request management, AI/admin review, and notification/monitoring/reporting; all detailed process numbering remains under Level 1 process 1.0.
- [ ] Level 0/1/2 data flows are balanced and use consistent process names.
- [ ] Cloudinary stores files; Supabase-hosted PostgreSQL stores metadata and references.
- [ ] Sensitive documents are not publicly accessible by default.
- [ ] OpenRouter key stays on the backend and the chosen model supports the required input type.
- [ ] AI result is advisory and human approval/rejection is mandatory.
- [ ] No real transfers, card credentials, or production bank integration are claimed.
- [ ] Actual tests are run and their results are reported honestly.
- [ ] The 60 daily entries match work actually carried out.
- [ ] The 12 supervisor evaluation forms are left for the supervisor's actual ratings and signatures.

## Official Technical References

- Supabase PostgreSQL connection methods and connection strings: https://supabase.com/docs/guides/database/connecting-to-postgres
- OpenRouter developer platform and API endpoint: https://openrouter.ai/developers
- OpenRouter framework/OpenAI SDK integration: https://openrouter.ai/docs/community/frameworks
- Cloudinary Upload API reference: https://cloudinary.com/documentation/image_upload_api_reference
- Cloudinary media access control and authentication: https://cloudinary.com/documentation/control_access_to_media
- Cloudinary upload parameters: https://cloudinary.com/documentation/upload_parameters
