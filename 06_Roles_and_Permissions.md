# 06_Roles_and_Permissions.md

# Simple Agency Tool

**Document:** 06_Roles_and_Permissions.md\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

This document defines the complete authorization model for Simple Agency
Tool.

It specifies who can view, create, update, archive, restore, or delete
every resource in the application.

This document is intended to be implemented directly using Supabase Row
Level Security (RLS).

------------------------------------------------------------------------

# Authorization Principles

## Least Privilege

Users should only see information required for their work.

## Secure by Default

New users receive the lowest required permissions.

## Role-Based Access Control (RBAC)

Permissions are assigned through roles, not individuals.

Future versions may introduce custom roles without redesigning the
permission model.

------------------------------------------------------------------------

# Roles

## Owner

Business owner with unrestricted access.

Responsibilities

-   Manage company
-   Financial visibility
-   User management
-   System configuration

------------------------------------------------------------------------

## Admin

Operational manager.

Responsibilities

-   Client operations
-   Project management
-   Team coordination

Cannot access quotations or payment information.

------------------------------------------------------------------------

## Employee

Executes assigned work.

Responsibilities

-   Complete tasks
-   Update progress
-   Participate in projects

------------------------------------------------------------------------

## Freelancer

Temporary contributor.

Responsibilities

-   Complete assigned tasks only.

------------------------------------------------------------------------

# Permission Matrix

  Feature       Owner   Admin   Employee   Freelancer
  ------------ ------- ------- ---------- ------------
  Dashboard       ✓       ✓        ✓           ✓
  Clients         ✓       ✓     Assigned       No
  Quotations      ✓      No        No          No
  Projects        ✓       ✓     Assigned    Assigned
  Tasks           ✓       ✓     Assigned    Assigned
  Kanban          ✓       ✓        ✓           ✓
  Calendar        ✓       ✓        ✓           ✓
  Users           ✓      No        No          No
  Settings        ✓      No        No          No

------------------------------------------------------------------------

# Page-Level Permissions

Dashboard - Everyone

Clients - Owner - Admin - Employee (assigned clients only)

Projects - Based on assignment

Calendar - Personal tasks for all users - Full project calendar for
Owner/Admin

Users - Owner only

Settings - Owner only

------------------------------------------------------------------------

# Field-Level Permissions

## Payment Information

Visible: - Owner

Hidden: - Admin - Employee - Freelancer

## Quotation Amount

Visible: - Owner

## Internal Notes (future)

Owner/Admin only.

------------------------------------------------------------------------

# Action Permissions

## Clients

Owner - Create - Edit - Archive - Restore - Delete

Admin - Create - Edit - Archive

Employee - View assigned

Freelancer - None

------------------------------------------------------------------------

## Projects

Owner/Admin - Full management

Employee - Update assigned project status where permitted -
Create/update assigned tasks (future configurable)

Freelancer - View assigned project context

------------------------------------------------------------------------

## Tasks

Owner/Admin - Full CRUD

Employee - Update assigned task - Comment - Change task status

Freelancer - Update own assigned task - Comment

------------------------------------------------------------------------

# UI Visibility Rules

If a user lacks permission:

-   Hide action buttons.
-   Disable restricted inputs.
-   Do not expose hidden data through the UI.

Avoid showing disabled controls when the action is impossible.

------------------------------------------------------------------------

# API Authorization Rules

Every request must validate:

1.  Authentication
2.  Role
3.  Record ownership or assignment

The frontend must never be the source of security.

------------------------------------------------------------------------

# Supabase RLS Mapping

Users: - Read own profile - Owner manages all

Clients: - Owner/Admin all - Employees assigned only

Projects: - Assigned members only

Tasks: - Assigned users - Project members - Owner/Admin

Quotations: - Owner only

------------------------------------------------------------------------

# Permission Failure UX

If access is denied:

-   Return HTTP 403 from backend.
-   Display: "You don't have permission to access this resource."

Never reveal hidden information.

------------------------------------------------------------------------

# Audit Requirements

Log:

-   Permission changes
-   User invitations
-   User removals
-   Role changes
-   Record deletion
-   Record restoration

Audit logs are immutable.

------------------------------------------------------------------------

# Security Edge Cases

-   Removing a user immediately revokes project access.
-   Archived users cannot log in.
-   Deleting a project never deletes audit history.
-   Soft-deleted records remain recoverable.

------------------------------------------------------------------------

# Future Extensibility

Designed to support:

-   Department roles
-   Client-specific permissions
-   Read-only users
-   Custom permission groups

Without changing the core RBAC model.

------------------------------------------------------------------------

# Definition of Done

Permissions are complete when:

-   Every page has access rules.
-   Every action has authorization.
-   Every sensitive field has visibility rules.
-   Backend RLS matches documentation.
-   UI hides unavailable actions.
-   Unauthorized API requests are rejected.
