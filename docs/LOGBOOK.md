# 60-Day Daily Logbook & 12 Weekly Evaluation Notes
## Smart Banking Service Request Portal with AI-Assisted Document Validation

> **How to use this pack:** The daily entries are written in logbook-ready English. Use each entry after completing the corresponding work. The weekly evaluation page is for the university supervisor to complete/rate.

---

# Part 1 — 60-Day Daily Logbook Entries

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

# Part 2 — 12 Weekly Supervisor Evaluation Notes

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
