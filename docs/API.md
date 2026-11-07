# REST API Documentation
## Smart Banking Service Request Portal API

Base URL: `http://localhost:5000/api`  
Authentication: Bearer Token (`Authorization: Bearer <JWT>`)

---

### 1. Authentication & Profile
- `POST /auth/register`: Register new customer profile.
  - Body: `{ full_name, email, phone, password, address }`
- `POST /auth/login`: Authenticate customer or administrator.
  - Body: `{ email, password }`
- `POST /auth/logout`: Invalidate client session.
- `GET /auth/me`: Retrieve current authenticated profile.
- `PATCH /auth/me`: Update profile details (`full_name`, `phone`, `address`).

### 2. Services Catalogue
- `GET /services`: List all 10 active digital banking services.
- `GET /services/document-types`: List all document types.
- `GET /services/:serviceId/requirements`: Get document requirements for a specific service.

### 3. Service Requests
- `POST /requests`: Create and submit a new banking service request.
  - Body: `{ service_id, subject, details }`
- `GET /requests`: List requests for current logged-in customer (paginated, status filter).
- `GET /requests/:requestId`: Detailed view of a request (includes documents, requirements, status history).
- `POST /requests/:requestId/cancel`: Customer cancellation (if request is still pending).
- `POST /requests/:requestId/documents`: Upload supporting document (Multer multipart form `file`, `document_type_id`).

### 4. Document Management & AI
- `GET /documents/:documentId/access`: Get authorized, time-limited secure URL for document preview.
- `POST /documents/:documentId/replace`: Re-upload replacement file for rejected/correction-requested document.
- `POST /ai/documents/:documentId/validate`: Trigger or re-run AI vision validation.
- `GET /ai/documents/:documentId/results`: Retrieve structured AI validation findings for document.
- `GET /ai/requests/:requestId/summary`: Generate automated AI executive synthesis for admin review.

### 5. Administrative Operations (Requires Role: ADMIN)
- `GET /admin/dashboard`: Metrics summary (customers, pending requests, approved, complaints, transactions).
- `GET /admin/customers`: Search and list customer profiles with pagination.
- `GET /admin/requests`: Administrator request review queue with filters.
- `GET /admin/requests/:requestId`: Full inspection view with documents and AI validation cards.
- `POST /admin/requests/:requestId/decision`: Issue administrative verdict (`APPROVE`, `REJECT`, `CORRECTION_REQUIRED`).
  - Body: `{ decision: "APPROVE"|"REJECT"|"CORRECTION_REQUIRED", remarks: "..." }`

### 6. Complaints & Support
- `POST /complaints`: Customer submits a dispute or complaint.
- `GET /complaints/my`: Current customer's lodged complaints.
- `GET /complaints/admin`: Administrator complaints management queue.
- `PATCH /complaints/admin/:complaintId`: Update status (`In Review`, `Resolved`, `Closed`) and record resolution.

### 7. Transaction Monitoring (Demo)
- `GET /transactions`: List synthetic demo transactions with risk monitoring filters.
- `PATCH /transactions/:transactionId/monitoring`: Update monitoring status (`Normal`, `Under_Review`, `Suspicious`, `Cleared`).

### 8. Reports & Audit
- `GET /reports/requests`: Aggregated request report with filters.
- `GET /reports/requests/export-csv`: Download CSV export of request data.
- `GET /reports/audit-logs`: Paginated administrative security audit log.

