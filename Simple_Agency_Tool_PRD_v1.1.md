# Product Requirements Document (PRD)

# Simple Agency Tool

**Version:** 1.1 (MVP)\
**Status:** Product Definition\
**Author:** EYB (Elevate Your Brand)

------------------------------------------------------------------------

# 1. Product Overview

Simple Agency Tool is an internal web application for small digital
agencies to manage clients, projects, tasks and team collaboration
without the complexity of enterprise software.

The application should feel closer to **Linear**, **Notion**, and
**Basecamp** than traditional CRMs.

------------------------------------------------------------------------

# 2. Product Philosophy

## Simplicity First

Every feature should solve a real agency problem while remaining easy to
learn.

## Speed

Common actions should require as few clicks as possible.

## Focus

Every screen answers one primary question.

-   Dashboard → What needs attention today?
-   Projects → What is the current status?
-   Tasks → What should I work on next?

## Consistency

The same interaction patterns should be used throughout the application.

## Collaboration

Everyone should always know:

-   Who is working on what
-   What is pending
-   What is blocked
-   What is due

------------------------------------------------------------------------

# 3. Goals

## Primary Goals

-   Manage clients
-   Manage quotations
-   Track projects
-   Organize tasks
-   Team collaboration
-   Shared project visibility
-   Calendar scheduling
-   Kanban planning
-   Google Drive integration

## Out of Scope (Version 1)

-   Accounting
-   Payroll
-   AI Assistant
-   Email Marketing
-   Time Tracking
-   Inventory
-   Chat
-   Client Portal

------------------------------------------------------------------------

# 4. Target Users

-   Owner
-   Admin
-   Employee
-   Freelancer

------------------------------------------------------------------------

# 5. Responsive Design Requirements

The application must be fully responsive.

## Desktop

Primary working environment.

## Tablet

Full functionality with adapted layouts.

## Mobile

All daily work should be possible:

-   View dashboard
-   Update tasks
-   Move cards in Kanban
-   View calendar
-   Open Drive folders
-   View project progress
-   Comment on tasks

Administrative screens remain optimized for desktop.

------------------------------------------------------------------------

# 6. Modules

## Dashboard

-   Today's Tasks
-   My Projects
-   Overdue Tasks
-   Upcoming Deadlines
-   Waiting for Client
-   Recent Activity
-   Quick Search

------------------------------------------------------------------------

## Clients

Fields

-   Company Name
-   Contact Person
-   Email
-   Phone
-   Address
-   Website
-   Industry
-   Status
-   Notes
-   Google Drive Link
-   Projects
-   Quotations
-   Payment Summary (Owner only)

Client Status

-   Lead
-   Discussion
-   Proposal Sent
-   Won
-   In Progress
-   Completed
-   Support
-   Inactive

------------------------------------------------------------------------

## Quotations

-   Multiple quotations per client
-   Amount
-   Status
-   Remarks
-   Google Drive PDF
-   Payment tracking

Visible only to Owner.

------------------------------------------------------------------------

## Projects

Each client can have multiple projects.

Fields

-   Name
-   Description
-   Team Members
-   Status
-   Priority
-   Start Date
-   Due Date
-   Notes
-   Drive Folder

Project Status

-   Planning
-   Waiting for Client
-   In Progress
-   Review
-   Completed
-   On Hold
-   Cancelled

------------------------------------------------------------------------

## Tasks

Each project contains tasks.

Fields

-   Title
-   Description
-   Assigned User
-   Priority
-   Due Date
-   Status
-   Comments

Priority

-   Low
-   Medium
-   High
-   Critical

Status

-   To Do
-   In Progress
-   Review
-   Completed
-   Blocked

------------------------------------------------------------------------

# 7. Kanban Board (Included in MVP)

Projects and tasks should support Kanban views.

## Project Board

Columns

-   Planning
-   In Progress
-   Review
-   Completed
-   On Hold

Each card displays:

-   Project
-   Client
-   Progress
-   Due Date
-   Team

## Task Board

Columns

-   To Do
-   In Progress
-   Review
-   Blocked
-   Completed

Each card displays:

-   Task
-   Assignee
-   Priority
-   Due Date

------------------------------------------------------------------------

# 8. Drag-and-Drop

Supported in Version 1.

Users can:

-   Move task cards between columns.
-   Move project cards between columns.
-   Reorder cards inside a column.

Dragging updates status automatically.

------------------------------------------------------------------------

# 9. Calendar

Monthly, weekly and agenda views.

Display:

-   Project deadlines
-   Task deadlines

Filters

-   My Tasks
-   Team Tasks
-   Projects

Selecting an item opens its details.

------------------------------------------------------------------------

# 10. Files

No uploads.

Store Google Drive folder links for Clients, Projects and Tasks.

------------------------------------------------------------------------

# 11. Notes

Markdown editor with autosave.

------------------------------------------------------------------------

# 12. Search

Global instant search across Clients, Projects and Tasks.

------------------------------------------------------------------------

# 13. Activity Log

Track:

-   Client created
-   Project created
-   Task updated
-   Task completed
-   Comments

------------------------------------------------------------------------

# 14. Roles & Permissions

  Feature            Owner   Admin   Employee   Freelancer
  ----------------- ------- ------- ---------- ------------
  Clients              ✓       ✓     Assigned       No
  Quotations           ✓      No        No          No
  Projects             ✓       ✓     Assigned    Assigned
  Tasks                ✓       ✓     Assigned    Assigned
  Kanban               ✓       ✓        ✓           ✓
  Calendar             ✓       ✓        ✓           ✓
  User Management      ✓      No        No          No

------------------------------------------------------------------------

# 15. Technical Stack

Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   shadcn/ui

Backend

-   Supabase
-   PostgreSQL
-   Supabase Auth

Hosting

-   Cloudflare Pages
-   Supabase

------------------------------------------------------------------------

# 16. Design Principles

-   Desktop-first
-   Fully responsive
-   Keyboard accessible
-   Touch-friendly
-   Maximum three clicks to reach any task
-   Minimal animations
-   Fast page loads
-   Linear-inspired UI
-   Cards over tables where appropriate

------------------------------------------------------------------------

# 17. Success Criteria

-   Learnable within 15 minutes.
-   Create a client in under 2 minutes.
-   Create a project in under 3 minutes.
-   Drag tasks between stages instantly.
-   Dashboard loads in under 2 seconds.
-   Fully usable on desktop, tablet and mobile.

------------------------------------------------------------------------

# 18. Future Roadmap

-   Invoicing
-   File uploads
-   Email notifications
-   Client Portal
-   Time tracking
-   Mobile apps
-   API integrations
