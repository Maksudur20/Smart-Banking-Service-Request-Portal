# Software Requirements Specification (SRS)
## Smart Banking Service Request Portal with AI-Assisted Document Validation

---

### 1. Introduction & Purpose
This document specifies the software requirements for the **Smart Banking Service Request Portal with AI-Assisted Document Validation**, an academic practicum prototype designed to demonstrate modern full-stack development, human-in-the-loop AI assistance, and secure cloud database architecture.

### 2. Project Scope & Boundaries
- **Prototype Status:** The system is an academic practicum implementation utilizing synthetic and demonstration data.
- **Boundaries:** It does not link to live central banking transaction networks, issue production credit/loan verdicts, process real credit cards, or handle live payment card PIN/CVV numbers.
- **Human-in-the-Loop Principle:** AI components provide advisory insights only (readability, apparent completeness, and possible inconsistencies). Autonomous approval or rejection by AI is strictly prohibited. Final decisions remain the exclusive responsibility of authorized human bank administrators.

### 3. User Roles & Actors
1. **Customer:** Registers, authenticates, views 10 banking services, submits service requests, uploads required supporting documents, tracks status, receives in-app notifications, and lodges complaints.
2. **Bank Administrator / Officer:** Authenticates with staff credentials, views operational dashboard metrics, inspects customer applications, reviews uploaded documents and AI validation outputs, issues binding decisions (`Approve`, `Reject`, `Correction Required`), resolves customer complaints, and monitors simulated transaction streams.
3. **AI Validation Service:** External vision-capable AI service (OpenRouter API) that performs automated image quality, readability, completeness, and initial consistency scans, returning structured JSON reports.
4. **Notification Service:** Internal event-driven service delivering immediate in-app notifications upon request status updates, document correction alerts, or complaint resolutions.

---

### 4. Functional Requirements (FR-01 to FR-22)

| Requirement ID | Description |
| :--- | :--- |
| **FR-01** | The system shall allow customers to securely register and log in using email and hashed passwords. |
| **FR-02** | The system shall enforce role-based access control (RBAC) separating Customer and Admin capabilities. |
| **FR-03** | Customers shall be able to browse active digital banking service categories. |
| **FR-04** | Customers shall be able to submit a service request for a selected banking service. |
| **FR-05** | The system shall generate a unique human-readable request tracking number (e.g. `SBR-2026-00001`). |
| **FR-06** | The system shall display the mandatory and optional document requirements checklist for each service. |
| **FR-07** | Customers shall be able to upload permitted document files (`.jpg`, `.jpeg`, `.png`, `.pdf`) up to 10MB. |
| **FR-08** | Uploaded document assets shall be securely stored in Cloudinary, with metadata stored in PostgreSQL. |
| **FR-09** | The backend shall strictly validate file extension, MIME type, and size on the server side. |
| **FR-10** | The system shall support automated AI-assisted document review via OpenRouter Vision API. |
| **FR-11** | The backend shall parse and validate structured AI output (readability, completeness, confidence, issues). |
| **FR-12** | Customers shall be able to track request status and inspect the full chronological status history. |
| **FR-13** | Administrators shall be able to inspect customer application details and preview uploaded documents. |
| **FR-14** | Administrators shall be able to Approve, Reject, or Request Correction, with mandatory remarks. |
| **FR-15** | Every status transition shall record an entry in `request_status_history` noting actor and remarks. |
| **FR-16** | The system shall create in-app notifications for request status changes and compliance alerts. |
| **FR-17** | Customers shall be able to lodge and track complaints regarding banking services and card delivery. |
| **FR-18** | Administrators shall be able to manage complaint status (`In Review`, `Resolved`, `Closed`) and record resolution. |
| **FR-19** | Administrators shall be able to inspect simulated transaction records and adjust monitoring risk statuses. |
| **FR-20** | The administrative dashboard shall present real-time aggregated metrics derived from database tables. |
| **FR-21** | Significant administrative decisions, logins, and status transitions shall be written to immutable audit logs. |
| **FR-22** | Customers shall strictly access only their own requests, documents, and notifications. |

---

### 5. Non-Functional Requirements (NFR)
1. **Security:** Passwords hashed with bcrypt (cost factor 10); stateless JWT authentication; parameterized SQL queries; CORS and Helmet headers; rate-limiting on sensitive endpoints.
2. **Reliability & Fault Tolerance:** Database connection pooling with SSL; graceful fallback simulation mode when AI or storage providers are unavailable.
3. **Data Integrity:** Foreign key constraints with cascading rules; check constraints enforcing controlled status enums; automated `updated_at` trigger functions.
4. **Usability & Responsiveness:** Clean, accessible banking theme; responsive layout across desktop and mobile; distinct color-coded status badges and toast feedback.

---

### 6. Controlled System Statuses

```text
[Draft] -> [Submitted] -> [Document Review] -> [AI Validation] -> [Pending Admin Review]
                                                                        |
                       +------------------------------------------------+
                       |                        |                       |
                       v                        v                       v
             [Correction Required]         [Approved]              [Rejected]
                       |                        |
                       v                        v
             [Re-upload/AI Review]        [Completed]
```
