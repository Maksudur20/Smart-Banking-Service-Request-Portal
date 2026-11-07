# Smart Banking Service Request Portal with AI-Assisted Document Validation

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![Storage](https://img.shields.io/badge/Storage-Cloudinary-blue.svg)](https://cloudinary.com/)
[![AI](https://img.shields.io/badge/AI-OpenRouter%20Vision-purple.svg)](https://openrouter.ai/)
[![Tests](https://img.shields.io/badge/Tests-7%20Passed%2C%200%20Failed-brightgreen.svg)]()

> **Academic Practicum Prototype:** A secure, web-based digital banking service request and compliance portal featuring human-in-the-loop AI document validation, role-based customer & administrator interfaces, and complete audit logging.

---

## 🌟 Key Features

1. **Digital Customer Banking Portal:**
   - Online submission for 10 banking services (Account Opening, Card Replacement, Cheque Books, KYC update, etc.).
   - Dynamic document requirement checklists with file-type and size validation.
   - Secure Cloudinary document upload with real-time AI image validation status.
   - Live status tracking across controlled lifecycles with chronological audit history.
   - In-app notification center and dispute/complaint management.

2. **Bank Officer Review Workspace (Human-in-the-Loop):**
   - Centralized review queue with priority filtering and search.
   - Authorized document preview inspection.
   - Structured AI validation reports displaying Readability, Completeness, Confidence scores, Inconsistency flags, and Advisory Recommendations.
   - One-click AI Executive Briefing summary generator for applications.
   - Controlled administrative verdicts: **Approve Application**, **Reject Application**, or **Request Document Correction** (with mandatory remarks).

3. **Risk Oversight & Auditability:**
   - Synthetic demo transaction stream with rule-based AML monitoring flags.
   - Comprehensive administrative dashboard metrics.
   - Immutable security audit logs recording all user logins and status transitions.
   - One-click CSV export for compliance reporting.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Modern Vanilla CSS, Vanilla JavaScript (Fetch API) | High-performance, zero-framework, responsive banking UI |
| **Backend** | Node.js, Express.js | Modular REST API with MVC architecture |
| **Database** | Supabase-hosted PostgreSQL | 15 normalized tables, foreign keys, triggers, constraints, indexes |
| **Storage** | Cloudinary | Protected document asset storage in designated project folder |
| **AI Vision & Chat** | OpenRouter API (`google/gemma-4-31b-it:free` & fallback models) | Image clarity, completeness, consistency analysis & bilingual chatbot |
| **Security** | bcryptjs, jsonwebtoken, helmet, express-rate-limit | Strict RBAC, parameterized SQL queries, secure sessions |

---

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- Git

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Maksudur20/Smart-Banking-Service-Request-Portal.git
cd "Smart-Banking-Service-Request-Portal"
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory:
```bash
cp .env.example .env
```
Ensure your database, Cloudinary, and OpenRouter keys are set:
```env
PORT=5000
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=Smart-Banking-Service-Request-Portal
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=google/gemma-4-31b-it:free
```

### 3. Run Database Migrations & Seed Data
Execute the automated migration script to create all 15 tables and seed demo records:
```bash
node src/utils/migrate.js
```

### 4. Run Automated Tests
Verify all 7 unit and integration tests:
```bash
npm test
```

### 5. Start the Application
```bash
npm start
```
Visit **`http://localhost:5000`** in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

All seed accounts use the default password: `Password123!`

| Role | Email | Purpose |
| :--- | :--- | :--- |
| **Super Admin** | `admin@smartbank.com` | Full officer review, approvals, monitoring & reports |
| **Operations Officer** | `verifier@smartbank.com` | Document verification & complaint resolution |
| **Customer 1** | `customer@smartbank.com` | Savings account holder with active requests |
| **Customer 2** | `sadia@smartbank.com` | Relocated customer with correction-required request |
| **Customer 3** | `tanvir@smartbank.com` | Customer with pending KYC validation |

---

## 📚 Academic Practicum Documentation

Complete documentation and UML/DFD models are located in [`docs/`](./docs/):
- **[`docs/SRS.md`](./docs/SRS.md)** — Software Requirements Specification (FR-01 to FR-22, NFRs, Acceptance Criteria).
- **[`docs/API.md`](./docs/API.md)** — Complete REST API endpoint reference.
- **[`docs/DATABASE.md`](./docs/DATABASE.md)** — Database schema dictionary and ERD relationships.
- **[`docs/TEST-PLAN.md`](./docs/TEST-PLAN.md)** — Test cases, execution logs, and verification report.
- **[`docs/LOGBOOK.md`](./docs/LOGBOOK.md)** — Complete 60-Day Daily Logbook (Activities & New Skills Learned) + 12 Weekly Supervisor Evaluation Notes.
- **[`docs/diagrams/DIAGRAMS.md`](./docs/diagrams/DIAGRAMS.md)** — Complete Mermaid diagrams:
  - System Architecture & Component Diagram
  - Exactly ONE Full Database ERD (15 Tables)
  - Exactly ONE DFD Level 0 Context Diagram
  - Exactly ONE DFD Level 1 (Single Process: `1.0 Customer & Service Request Management`)
  - Exactly THREE DFD Level 2 Detailed Process Sheets (Sub-processes `1.1` to `1.26`)
  - Use Case Diagrams for all 9 modules
  - Activity & Swimlane Workflow Diagrams
  - AI Human-in-the-Loop Sequence Diagram

---

## 📄 License & Academic Integrity
Developed as an academic practicum prototype. Synthetic sample data used for demonstration purposes. Not intended for production financial transactions.
