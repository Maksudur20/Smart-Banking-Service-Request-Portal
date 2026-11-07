# Database Architecture & Data Dictionary
## Supabase-hosted PostgreSQL

---

### Database Tables Overview (15 Normalized Relational Tables)

| Table Name | Description | Key Relationships |
| :--- | :--- | :--- |
| `users` | Base identity, credentials, and roles (`CUSTOMER`, `ADMIN`). | Parent of `customers`, `admins`, `audit_logs`. |
| `customers` | Profile data for retail banking customers. | 1:1 with `users`, 1:M with `service_requests`, `complaints`. |
| `admins` | Profile data for bank review officers. | 1:1 with `users`, 1:M assigned requests and complaints. |
| `services` | 10 digital banking services catalogue. | 1:M with `service_document_requirements`, `service_requests`. |
| `document_types` | Master catalogue of recognized legal document types. | 1:M with `service_document_requirements`, `request_documents`. |
| `service_document_requirements` | M:N relation defining required documents per service. | Connects `services` and `document_types`. |
| `service_requests` | Core customer application lifecycle entity. | M:1 with `customers`, `services`, `admins`. |
| `request_documents` | Metadata and Cloudinary asset IDs for uploaded files. | M:1 with `service_requests`, `document_types`, `users`. |
| `ai_validations` | Structured validation findings returned by OpenRouter AI. | M:1 with `request_documents`. |
| `request_status_history` | Audit trail of all request state transitions. | M:1 with `service_requests`, `users`. |
| `notifications` | In-app notification queue for customers and officers. | M:1 with `users`, `service_requests`, `complaints`. |
| `complaints` | Customer disputes and inquiry tickets. | M:1 with `customers`, `service_requests`, `admins`. |
| `complaint_history` | Audit trail of complaint status changes. | M:1 with `complaints`, `users`. |
| `demo_transactions` | Seeded synthetic transactions for AML monitoring demo. | Optional M:1 with `customers`. |
| `audit_logs` | Immutable security audit log of administrative actions. | M:1 with `users`. |

---

### Key Database Design Decisions
1. **Cloudinary Asset Storage vs Database Binary:** Files are never stored as bytea/blobs in PostgreSQL. Only Cloudinary public IDs, secure delivery URLs, MIME types, and file sizes are stored.
2. **Automated Timestamp Triggers:** All tables with `updated_at` utilize a PostgreSQL trigger (`update_updated_at_column`) to ensure timestamps update automatically on row modifications.
3. **Structured AI Storage:** AI outputs (readability, completeness, confidence, issues) are parsed and stored as native PostgreSQL columns and JSONB to allow direct SQL aggregation and reporting.

