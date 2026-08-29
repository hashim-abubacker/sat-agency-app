# 05_Database_Schema.md

# Simple Agency Tool

**Document:** 05_Database_Schema.md\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

This document defines the complete data model for Simple Agency Tool.

It serves as the single source of truth for database design,
relationships, validation rules, indexing strategy, security planning,
and future scalability.

------------------------------------------------------------------------

# Design Principles

-   PostgreSQL (Supabase)
-   UUID primary keys
-   Soft delete for business records
-   Audit timestamps on every table
-   Referential integrity through foreign keys
-   No duplicated data
-   Future-proof schema for Version 2

------------------------------------------------------------------------

# Core Entity Relationship

``` text
Users
  │
  ├────────────┐
  │            │
Clients      Activity Logs
  │
  ├── Quotations
  │
  └── Projects
        │
        ├── Tasks
        │     ├── Comments
        │     └── Activity
        │
        └── Project Members
```

------------------------------------------------------------------------

# Naming Conventions

Tables: - plural snake_case

Columns: - snake_case

Primary Keys: - id (UUID)

Foreign Keys: - client_id - project_id - task_id - user_id

------------------------------------------------------------------------

# Common Audit Fields

Every table contains:

-   id (UUID)
-   created_at
-   updated_at
-   created_by
-   updated_by
-   deleted_at (nullable)

------------------------------------------------------------------------

# Users

Purpose: Application authentication and permissions.

Fields

  Column      Type   Required   Notes
  ----------- ------ ---------- ---------------------------------
  id          UUID   ✓          PK
  full_name   Text   ✓          
  email       Text   ✓          Unique
  role        Enum   ✓          owner/admin/employee/freelancer
  status      Enum   ✓          active/inactive

Validation

-   Email unique
-   Role required

Indexes

-   email
-   role

------------------------------------------------------------------------

# Clients

Purpose: Commercial record.

Fields

-   company_name
-   contact_name
-   email
-   phone
-   website
-   address
-   industry
-   status
-   notes
-   drive_url

Validation

-   Company name required
-   Valid email
-   Valid URL

Status Enum

-   lead
-   discussion
-   proposal_sent
-   won
-   in_progress
-   completed
-   support
-   inactive

------------------------------------------------------------------------

# Quotations

Relationship

Client → Many Quotations

Fields

-   quotation_number
-   amount
-   advance_received
-   balance
-   status
-   remarks
-   drive_url

Status

-   draft
-   sent
-   approved
-   rejected
-   expired

Visibility

Owner only.

------------------------------------------------------------------------

# Projects

Relationship

Client → Many Projects

Fields

-   name
-   description
-   priority
-   status
-   start_date
-   due_date
-   drive_url

Status

-   planning
-   waiting
-   in_progress
-   review
-   completed
-   on_hold
-   cancelled

Rules

-   Cannot exist without Client.

------------------------------------------------------------------------

# Project Members

Many-to-many relationship.

Fields

-   project_id
-   user_id
-   role_in_project

Purpose

Support multiple team members.

------------------------------------------------------------------------

# Tasks

Relationship

Project → Many Tasks

Fields

-   title
-   description
-   assigned_to
-   priority
-   status
-   due_date
-   order_index

Priority

-   low
-   medium
-   high
-   critical

Status

-   todo
-   in_progress
-   review
-   blocked
-   completed

Rules

-   Assigned user optional.
-   Belongs to one project.

------------------------------------------------------------------------

# Comments

Task discussion.

Fields

-   task_id
-   user_id
-   comment

Markdown supported.

------------------------------------------------------------------------

# Activity Logs

Track:

-   Create
-   Update
-   Delete
-   Restore
-   Status Change
-   Assignment Change

Immutable records.

------------------------------------------------------------------------

# Validation Rules

-   Trim whitespace.
-   Reject empty strings.
-   Sanitize URLs.
-   Dates stored in UTC.
-   Enum values only.

------------------------------------------------------------------------

# Delete Strategy

Never permanently delete business records.

Use soft deletes:

deleted_at

Owners may restore archived records.

------------------------------------------------------------------------

# Index Strategy

Indexes

Users: - email

Clients: - company_name - status

Projects: - client_id - status - due_date

Tasks: - project_id - assigned_to - due_date - status - order_index

------------------------------------------------------------------------

# Security Considerations

Supabase Row Level Security:

Owner: Full access

Admin: Operational access

Employee: Assigned projects/tasks only

Freelancer: Assigned tasks only

Quotations restricted to Owner.

------------------------------------------------------------------------

# Future Expansion

Reserved tables:

-   notifications
-   time_entries
-   attachments
-   client_portal_users
-   integrations
-   invoices

No schema redesign should be required.

------------------------------------------------------------------------

# Definition of Done

The schema is complete when:

-   Every screen maps to an entity.
-   Every relationship is documented.
-   Validation rules are defined.
-   Delete behavior is defined.
-   Indexes exist for common queries.
-   RLS can be implemented directly from this document.
