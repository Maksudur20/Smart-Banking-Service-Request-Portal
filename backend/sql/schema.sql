-- ====================================================================
-- SMART BANKING SERVICE REQUEST PORTAL
-- Database Schema for Supabase-hosted PostgreSQL
-- Blueprint compliant (Section 12)
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if re-initializing (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS demo_transactions CASCADE;
DROP TABLE IF EXISTS complaint_history CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS request_status_history CASCADE;
DROP TABLE IF EXISTS ai_validations CASCADE;
DROP TABLE IF EXISTS request_documents CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS service_document_requirements CASCADE;
DROP TABLE IF EXISTS document_types CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. CUSTOMERS PROFILE TABLE
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    customer_reference VARCHAR(50) NOT NULL UNIQUE,
    account_number VARCHAR(30),
    date_of_birth DATE,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_reference ON customers(customer_reference);

-- 3. ADMINS PROFILE TABLE
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    staff_reference VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) DEFAULT 'Operations & Verification',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_user_id ON admins(user_id);

-- 4. SERVICES CATALOGUE TABLE
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General Banking',
    processing_time_days INTEGER DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_code ON services(service_code);
CREATE INDEX idx_services_active ON services(is_active);

-- 5. DOCUMENT TYPES TABLE
CREATE TABLE document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. SERVICE DOCUMENT REQUIREMENTS TABLE
CREATE TABLE service_document_requirements (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    document_type_id INTEGER NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_extensions VARCHAR(100) NOT NULL DEFAULT 'jpg,jpeg,png,pdf',
    max_size_mb NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_document UNIQUE (service_id, document_type_id)
);

CREATE INDEX idx_sdr_service_id ON service_document_requirements(service_id);

-- 7. SERVICE REQUESTS TABLE
CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    subject VARCHAR(200) NOT NULL,
    details TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted' CHECK (
        status IN (
            'Draft',
            'Submitted',
            'Document Review',
            'AI Validation',
            'Pending Admin Review',
            'Correction Required',
            'Approved',
            'Rejected',
            'Completed',
            'Cancelled'
        )
    ),
    assigned_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_customer_id ON service_requests(customer_id);
CREATE INDEX idx_requests_service_id ON service_requests(service_id);
CREATE INDEX idx_requests_status ON service_requests(status);
CREATE INDEX idx_requests_number ON service_requests(request_number);
CREATE INDEX idx_requests_created_at ON service_requests(created_at DESC);

-- 8. REQUEST DOCUMENTS TABLE
CREATE TABLE request_documents (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    document_type_id INTEGER NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    cloudinary_resource_type VARCHAR(50) DEFAULT 'image',
    delivery_type VARCHAR(50) DEFAULT 'upload',
    secure_url TEXT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Uploaded' CHECK (
        verification_status IN ('Uploaded', 'AI_Reviewed', 'Verified', 'Rejected', 'Superseded')
    ),
    ai_validation_status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (
        ai_validation_status IN ('Pending', 'Processing', 'Completed', 'Failed', 'Skipped')
    ),
    uploaded_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reqdocs_request_id ON request_documents(request_id);
CREATE INDEX idx_reqdocs_doctype_id ON request_documents(document_type_id);

-- 9. AI VALIDATIONS TABLE
CREATE TABLE ai_validations (
    id SERIAL PRIMARY KEY,
    request_document_id INTEGER NOT NULL REFERENCES request_documents(id) ON DELETE CASCADE,
    model_id VARCHAR(150) NOT NULL,
    readability_status VARCHAR(50) NOT NULL DEFAULT 'unknown' CHECK (
        readability_status IN ('readable', 'partially_readable', 'unreadable', 'unknown')
    ),
    completeness_status VARCHAR(50) NOT NULL DEFAULT 'unknown' CHECK (
        completeness_status IN ('appears_complete', 'appears_incomplete', 'unknown')
    ),
    possible_mismatch BOOLEAN DEFAULT FALSE,
    confidence NUMERIC(4, 3) CHECK (confidence >= 0 AND confidence <= 1),
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT,
    recommendation TEXT,
    uncertainty_note TEXT,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'Success' CHECK (
        validation_status IN ('Success', 'Provider_Error', 'Validation_Error', 'Timeout')
    ),
    error_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_val_document_id ON ai_validations(request_document_id);

-- 10. REQUEST STATUS HISTORY TABLE
CREATE TABLE request_status_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rsh_request_id ON request_status_history(request_id);
CREATE INDEX idx_rsh_created_at ON request_status_history(created_at DESC);

-- 11. COMPLAINTS TABLE (Must precede notifications due to foreign key option)
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    complaint_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (
        status IN ('Open', 'In Review', 'Resolved', 'Closed')
    ),
    assigned_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_number ON complaints(complaint_number);

-- 12. COMPLAINT HISTORY TABLE
CREATE TABLE complaint_history (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    changed_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ch_complaint_id ON complaint_history(complaint_id);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 14. DEMO TRANSACTIONS TABLE (Synthetic/Academic)
CREATE TABLE demo_transactions (
    id SERIAL PRIMARY KEY,
    transaction_reference VARCHAR(60) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    account_number VARCHAR(30) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN ('Deposit', 'Withdrawal', 'Transfer', 'Card_Payment', 'Service_Fee')
    ),
    transaction_status VARCHAR(50) NOT NULL DEFAULT 'Completed' CHECK (
        transaction_status IN ('Completed', 'Pending', 'Flagged', 'Blocked')
    ),
    monitoring_status VARCHAR(50) NOT NULL DEFAULT 'Normal' CHECK (
        monitoring_status IN ('Normal', 'Under_Review', 'Suspicious', 'Cleared')
    ),
    flag_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demo_tx_customer_id ON demo_transactions(customer_id);
CREATE INDEX idx_demo_tx_monitoring ON demo_transactions(monitoring_status);
CREATE INDEX idx_demo_tx_created_at ON demo_transactions(created_at DESC);

-- 15. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Helper trigger function to update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_request_documents_updated_at BEFORE UPDATE ON request_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

