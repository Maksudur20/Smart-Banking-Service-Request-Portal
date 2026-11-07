-- ====================================================================
-- SMART BANKING SERVICE REQUEST PORTAL
-- Seed Data for Supabase-hosted PostgreSQL
-- ====================================================================

-- 1. USERS (Password for all seed users is 'Password123!')
-- Hash: $2a$10$2o6ri4dgWcYqi9wuPPxV5.RkmE/9i0heUB1SCXZO0H1Ji3XK0mC1K
INSERT INTO users (id, full_name, email, phone, password_hash, role, is_active) VALUES
(1, 'System Administrator', 'admin@smartbank.com', '+8801700000001', '$2a$10$2o6ri4dgWcYqi9wuPPxV5.RkmE/9i0heUB1SCXZO0H1Ji3XK0mC1K', 'ADMIN', TRUE),
(2, 'Operations Officer', 'verifier@smartbank.com', '+8801700000002', '$2a$10$2o6ri4dgWcYqi9wuPPxV5.RkmE/9i0heUB1SCXZO0H1Ji3XK0mC1K', 'ADMIN', TRUE),
(3, 'John Customer', 'customer@smartbank.com', '+8801800000001', '$2a$10$2o6ri4dgWcYqi9wuPPxV5.RkmE/9i0heUB1SCXZO0H1Ji3XK0mC1K', 'CUSTOMER', TRUE),
(4, 'Sadia Rahman', 'sadia@smartbank.com', '+8801800000002', '$2a$10$2o6ri4dgWcYqi9wuPPxV5.RkmE/9i0heUB1SCXZO0H1Ji3XK0mC1K', 'CUSTOMER', TRUE),
(5, 'Tanvir Ahmed', 'tanvir@smartbank.com', '+8801800000003', '$2a$10$2o6ri4dgWcYqi9wuPPxV5.RkmE/9i0heUB1SCXZO0H1Ji3XK0mC1K', 'CUSTOMER', TRUE);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. ADMINS
INSERT INTO admins (id, user_id, staff_reference, department) VALUES
(1, 1, 'STAFF-ADMIN-01', 'Operations & Risk Oversight'),
(2, 2, 'STAFF-VERIFY-02', 'Document Verification & KYC');

SELECT setval('admins_id_seq', (SELECT MAX(id) FROM admins));

-- 3. CUSTOMERS
INSERT INTO customers (id, user_id, customer_reference, account_number, date_of_birth, address) VALUES
(1, 3, 'CUST-2026-0001', '202611010001', '1990-05-15', 'House 42, Road 11, Banani, Dhaka-1213'),
(2, 4, 'CUST-2026-0002', '202611010002', '1995-08-22', 'Flat 5B, Green Tower, Dhanmondi, Dhaka-1205'),
(3, 5, 'CUST-2026-0003', '202611010003', '1988-12-04', 'Plot 18, Sector 4, Uttara, Dhaka-1230');

SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- 4. SERVICES CATALOGUE (10 Standard Practicum Services)
INSERT INTO services (id, service_code, name, description, category, processing_time_days, is_active) VALUES
(1, 'ACC_OPEN', 'Account Opening Request', 'Open a new Savings or Current account with digital document verification.', 'Accounts', 2, TRUE),
(2, 'ACC_UPDATE', 'Account Information Update', 'Update your registered phone, address, or communication preferences.', 'Accounts', 1, TRUE),
(3, 'CARD_NEW', 'Debit/Credit Card Request', 'Apply for a new contactless international debit card or classic credit card.', 'Cards', 3, TRUE),
(4, 'CARD_REPLACE', 'Card Replacement Request', 'Request replacement for lost, stolen, damaged, or expired bank cards.', 'Cards', 2, TRUE),
(5, 'CHEQUE_BOOK', 'Cheque Book Request', 'Order a 25 or 50 leaf personalized cheque book for your active account.', 'Accounts', 2, TRUE),
(6, 'NET_BANKING', 'Internet Banking Activation', 'Activate secure 24/7 online banking portal access with dual factor protection.', 'Digital Banking', 1, TRUE),
(7, 'MOBILE_BANKING', 'Mobile Banking Service Request', 'Link your smart banking wallet, biometric login, and push notification services.', 'Digital Banking', 1, TRUE),
(8, 'LOAN_INQUIRY', 'Loan Service Inquiry', 'Inquire about home, auto, or personal loan eligibility and required criteria.', 'Loans', 4, TRUE),
(9, 'KYC_VERIFY', 'KYC / Document Verification', 'Periodic re-KYC and biometric national identity document re-verification.', 'Compliance', 2, TRUE),
(10, 'FUND_TRANSFER_QUERY', 'Fund Transfer Query', 'Dispute or check status of an erroneous or pending EFTN/NPSB/RTGS fund transfer.', 'Payments', 2, TRUE);

SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));

-- 5. DOCUMENT TYPES
INSERT INTO document_types (id, name, description) VALUES
(1, 'National ID (NID)', 'Front and back side of government-issued Smart National ID card'),
(2, 'Passport', 'Valid government-issued international travel passport data page'),
(3, 'Utility Bill', 'Recent electricity, gas, or water bill not older than 3 months for address verification'),
(4, 'Salary Certificate', 'Latest employer letterhead salary slip or formal employment certificate'),
(5, 'Passport Size Photograph', 'Recent color photograph with white background'),
(6, 'Bank Statement', 'Formal account statement of last 6 months certified by issuing branch'),
(7, 'Signature Specimen', 'Clear handwritten signature on plain white paper'),
(8, 'Trade License', 'Valid municipal trade license copy for business/sole proprietor accounts');

SELECT setval('document_types_id_seq', (SELECT MAX(id) FROM document_types));

-- 6. SERVICE DOCUMENT REQUIREMENTS
INSERT INTO service_document_requirements (service_id, document_type_id, is_required, allowed_extensions, max_size_mb) VALUES
-- Account Opening: NID, Photo, Utility Bill
(1, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(1, 5, TRUE, 'jpg,jpeg,png', 3.00),
(1, 3, TRUE, 'jpg,jpeg,png,pdf', 5.00),
-- Account Update: NID, Utility Bill
(2, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(2, 3, FALSE, 'jpg,jpeg,png,pdf', 5.00),
-- Debit/Credit Card: NID, Salary Certificate
(3, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(3, 4, TRUE, 'jpg,jpeg,png,pdf', 5.00),
-- Card Replacement: NID, Signature Specimen
(4, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(4, 7, TRUE, 'jpg,jpeg,png', 2.00),
-- Cheque Book: Signature Specimen
(5, 7, TRUE, 'jpg,jpeg,png', 2.00),
-- Internet Banking: NID
(6, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
-- Mobile Banking: NID, Photo
(7, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(7, 5, FALSE, 'jpg,jpeg,png', 3.00),
-- Loan Inquiry: NID, Salary Certificate, Bank Statement
(8, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(8, 4, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(8, 6, TRUE, 'pdf,jpg,png', 10.00),
-- KYC Verification: NID, Photo
(9, 1, TRUE, 'jpg,jpeg,png,pdf', 5.00),
(9, 5, TRUE, 'jpg,jpeg,png', 3.00),
-- Fund Transfer Query: Bank Statement
(10, 6, TRUE, 'pdf,jpg,png', 10.00);

-- 7. SERVICE REQUESTS (Sample requests across different lifecycles)
INSERT INTO service_requests (id, request_number, customer_id, service_id, subject, details, status, assigned_admin_id, submitted_at, created_at) VALUES
(1, 'SBR-2026-00001', 1, 1, 'Application for High Yield Savings Account', 'Requesting new high yield savings account opening with digital card issuance.', 'Pending Admin Review', 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(2, 'SBR-2026-00002', 1, 3, 'Application for International Platinum Debit Card', 'Need dual currency platinum debit card for international e-commerce payments.', 'Approved', 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(3, 'SBR-2026-00003', 2, 5, 'Cheque Book 25 Leaves Urgent Request', 'Urgent cheque book request for Dhanmondi branch pickup.', 'Completed', 2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(4, 'SBR-2026-00004', 2, 2, 'Address update after residential relocation', 'Recently relocated to Dhanmondi flat, requesting address change in bank records.', 'Correction Required', 2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(5, 'SBR-2026-00005', 3, 9, 'Periodic KYC Profile Update', 'Uploading newly issued Smart National ID card for compliance update.', 'AI Validation', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours');

SELECT setval('service_requests_id_seq', (SELECT MAX(id) FROM service_requests));

-- 8. REQUEST DOCUMENTS
INSERT INTO request_documents (id, request_id, document_type_id, cloudinary_public_id, cloudinary_resource_type, delivery_type, secure_url, original_file_name, mime_type, file_size_bytes, verification_status, ai_validation_status, uploaded_by_user_id, created_at) VALUES
(1, 1, 1, 'smart_banking/docs/demo_nid_john_front', 'image', 'upload', 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'john_nid_front.jpg', 'image/jpeg', 1450230, 'AI_Reviewed', 'Completed', 3, NOW() - INTERVAL '2 days'),
(2, 1, 5, 'smart_banking/docs/demo_photo_john', 'image', 'upload', 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'john_formal_photo.png', 'image/png', 892300, 'AI_Reviewed', 'Completed', 3, NOW() - INTERVAL '2 days'),
(3, 4, 3, 'smart_banking/docs/demo_utility_sadia', 'image', 'upload', 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'electric_bill_blur.jpg', 'image/jpeg', 642100, 'Rejected', 'Completed', 4, NOW() - INTERVAL '1 day'),
(4, 5, 1, 'smart_banking/docs/demo_nid_tanvir', 'image', 'upload', 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'tanvir_nid_smart.jpg', 'image/jpeg', 1210400, 'Uploaded', 'Processing', 5, NOW() - INTERVAL '3 hours');

SELECT setval('request_documents_id_seq', (SELECT MAX(id) FROM request_documents));

-- 9. AI VALIDATIONS (Demonstrating structured AI assistance output)
INSERT INTO ai_validations (id, request_document_id, model_id, readability_status, completeness_status, possible_mismatch, confidence, issues, summary, recommendation, uncertainty_note, validation_status) VALUES
(1, 1, 'openai/gpt-4o-mini', 'readable', 'appears_complete', FALSE, 0.940, 
 '[]'::jsonb, 
 'Document appears to be a standard Bangladesh National ID card. Full name, NID number, date of birth, and parents names are clearly legible with no obvious distortion.', 
 'Document satisfies visual readability checks. Recommend proceed with admin verification.', 
 'Visual authenticity check only. Physical security holograms and RFID chip cannot be validated via digital image.', 
 'Success'),
(2, 2, 'openai/gpt-4o-mini', 'readable', 'appears_complete', FALSE, 0.960,
 '[]'::jsonb,
 'Front-facing portrait photograph with plain neutral background. Facial features are sharp and evenly illuminated.',
 'Meets passport photo guidelines. Recommend proceed to admin review.',
 'Biometric facial match with NID requires separate automated face-matching verification.',
 'Success'),
(3, 3, 'openai/gpt-4o-mini', 'partially_readable', 'appears_incomplete', TRUE, 0.580,
 '["Lower billing address portion is blurred and illegible due to poor focus", "Consumer billing account number is partially cropped on left edge"]'::jsonb,
 'Utility bill image suffers from motion blur in address section and incomplete edge capture.',
 'Do not reject outright; request customer to upload a clearer, uncropped copy or digital PDF e-bill.',
 'Cannot confirm customer residency address due to blurred text.',
 'Success');

SELECT setval('ai_validations_id_seq', (SELECT MAX(id) FROM ai_validations));

-- 10. REQUEST STATUS HISTORY
INSERT INTO request_status_history (request_id, old_status, new_status, changed_by_user_id, remarks, created_at) VALUES
(1, 'Draft', 'Submitted', 3, 'Customer completed form and submitted initial documents.', NOW() - INTERVAL '2 days'),
(1, 'Submitted', 'Document Review', 2, 'Assigned to Operations Officer for document review.', NOW() - INTERVAL '36 hours'),
(1, 'Document Review', 'AI Validation', 2, 'Dispatched documents for AI readability and completeness scan.', NOW() - INTERVAL '35 hours'),
(1, 'AI Validation', 'Pending Admin Review', 2, 'AI validation completed with high confidence score. Pending final admin sign-off.', NOW() - INTERVAL '34 hours'),
(2, 'Submitted', 'Approved', 1, 'All KYC and income requirements fulfilled. Card request approved and queued for dispatch.', NOW() - INTERVAL '4 days'),
(4, 'Submitted', 'Correction Required', 2, 'Utility bill copy is blurred. Please upload a clear photo or e-bill PDF showing full address.', NOW() - INTERVAL '1 day');

-- 11. COMPLAINTS
INSERT INTO complaints (id, complaint_number, customer_id, request_id, category, subject, details, status, assigned_admin_id, resolution, created_at) VALUES
(1, 'CMP-2026-00001', 1, 2, 'Card Delivery', 'Inquiry on Platinum Debit Card physical dispatch', 'My card application SBR-2026-00002 was approved 3 days ago. Would appreciate courier tracking number.', 'In Review', 2, NULL, NOW() - INTERVAL '2 days'),
(2, 'CMP-2026-00002', 2, NULL, 'ATM Transaction', 'ATM Cash dispensing timeout during withdrawal', 'Attempted 5,000 BDT cash withdrawal at Dhanmondi Branch ATM. Account debited but cash was not dispensed.', 'Resolved', 1, 'Atm reconciliation team verified journal log. Amount 5,000 BDT reversed back to customer savings account.', NOW() - INTERVAL '7 days');

SELECT setval('complaints_id_seq', (SELECT MAX(id) FROM complaints));

-- 12. COMPLAINT HISTORY
INSERT INTO complaint_history (complaint_id, changed_by_user_id, old_status, new_status, remarks, created_at) VALUES
(1, 3, NULL, 'Open', 'Customer submitted ticket.', NOW() - INTERVAL '2 days'),
(1, 2, 'Open', 'In Review', 'Operations officer contacted courier desk for tracking update.', NOW() - INTERVAL '1 day'),
(2, 4, NULL, 'Open', 'Customer submitted ATM complaint.', NOW() - INTERVAL '7 days'),
(2, 1, 'Open', 'In Review', 'Sent to ATM electronic journal audit team.', NOW() - INTERVAL '6 days'),
(2, 1, 'In Review', 'Resolved', 'Debit reversal approved and credited.', NOW() - INTERVAL '5 days');

-- 13. NOTIFICATIONS
INSERT INTO notifications (user_id, request_id, complaint_id, title, message, channel, is_read, created_at) VALUES
(3, 1, NULL, 'Request Under Review', 'Your Savings Account Request (SBR-2026-00001) is currently being reviewed by our operations desk.', 'IN_APP', FALSE, NOW() - INTERVAL '34 hours'),
(3, 2, NULL, 'Card Request Approved', 'Congratulations! Your Debit Card Request (SBR-2026-00002) has been approved and is being personalized.', 'IN_APP', TRUE, NOW() - INTERVAL '4 days'),
(4, 4, NULL, 'Action Required: Document Resubmission', 'Request SBR-2026-00004 requires correction: Your utility bill was unclear. Please upload a legible copy.', 'IN_APP', FALSE, NOW() - INTERVAL '1 day'),
(4, NULL, 2, 'Complaint Resolved', 'Your ATM dispute complaint (CMP-2026-00002) has been resolved. Amount credited.', 'IN_APP', TRUE, NOW() - INTERVAL '5 days');

-- 14. DEMO TRANSACTIONS (Synthetic sample records for monitoring dashboard)
INSERT INTO demo_transactions (transaction_reference, customer_id, account_number, amount, currency, transaction_type, transaction_status, monitoring_status, flag_reason, created_at) VALUES
(CONCAT('TXN-', TO_CHAR(NOW(), 'YYYYMMDD'), '-00101'), 1, '202611010001', 25000.00, 'BDT', 'Deposit', 'Completed', 'Normal', NULL, NOW() - INTERVAL '4 hours'),
(CONCAT('TXN-', TO_CHAR(NOW(), 'YYYYMMDD'), '-00102'), 1, '202611010001', 5200.00, 'BDT', 'Card_Payment', 'Completed', 'Normal', NULL, NOW() - INTERVAL '8 hours'),
(CONCAT('TXN-', TO_CHAR(NOW(), 'YYYYMMDD'), '-00103'), 2, '202611010002', 850000.00, 'BDT', 'Transfer', 'Pending', 'Suspicious', 'Large transaction exceeding single transfer velocity benchmark for personal savings tier', NOW() - INTERVAL '2 hours'),
(CONCAT('TXN-', TO_CHAR(NOW(), 'YYYYMMDD'), '-00104'), 3, '202611010003', 15000.00, 'BDT', 'Withdrawal', 'Completed', 'Normal', NULL, NOW() - INTERVAL '1 day'),
(CONCAT('TXN-', TO_CHAR(NOW(), 'YYYYMMDD'), '-00105'), 2, '202611010002', 120000.00, 'BDT', 'Transfer', 'Completed', 'Under_Review', 'Multiple consecutive transfers within 10 minute window', NOW() - INTERVAL '1 day'),
(CONCAT('TXN-', TO_CHAR(NOW(), 'YYYYMMDD'), '-00106'), 1, '202611010001', 1200.00, 'BDT', 'Service_Fee', 'Completed', 'Normal', NULL, NOW() - INTERVAL '2 days');

-- 15. AUDIT LOGS
INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES
(1, 'USER_LOGIN', 'users', '1', '{"method": "password", "status": "success"}'::jsonb, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(2, 'REQUEST_STATUS_UPDATE', 'service_requests', '1', '{"from": "AI Validation", "to": "Pending Admin Review"}'::jsonb, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'REQUEST_APPROVAL', 'service_requests', '2', '{"decision": "Approved", "remarks": "Eligible"}'::jsonb, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(2, 'DOCUMENT_CORRECTION_REQUEST', 'service_requests', '4', '{"document": "Utility Bill", "reason": "Blurred image"}'::jsonb, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
