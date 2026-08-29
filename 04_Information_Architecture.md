# 04_Information_Architecture.md

# Simple Agency Tool

**Document:** 04_Information_Architecture.md\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

This document defines the structural blueprint of the application,
including navigation, page hierarchy, data relationships, responsive
behavior, and module dependencies.

------------------------------------------------------------------------

# Documentation Layers

Every section is described from three perspectives:

-   **Business:** Why it exists.
-   **UX:** How users experience it.
-   **Technical:** How it should be implemented.

------------------------------------------------------------------------

# Information Architecture Principles

-   Projects are the primary workspace.
-   Clients own Projects.
-   Projects own Tasks.
-   Maximum three clicks to reach common actions.
-   Global search available everywhere.
-   Consistent navigation across all devices.

------------------------------------------------------------------------

# Application Hierarchy

``` text
Simple Agency Tool
├── Dashboard
├── Clients
│   ├── Client Details
│   ├── Quotations
│   ├── Projects
│   └── Notes
├── Projects
│   ├── Overview
│   ├── Kanban
│   ├── Tasks
│   ├── Calendar
│   ├── Files
│   ├── Notes
│   └── Activity
├── Calendar
├── Users
├── Settings
└── Search
```

------------------------------------------------------------------------

# Navigation

Desktop: permanent sidebar.

Tablet: collapsible sidebar.

Mobile: slide-out navigation drawer.

Navigation order:

1.  Dashboard
2.  Clients
3.  Projects
4.  Calendar
5.  Users
6.  Settings
7.  Logout

------------------------------------------------------------------------

# Screen Inventory

## Dashboard

Purpose: Daily overview.

Primary actions: - Open task - Open project - Create client - Create
project

## Clients

Purpose: Commercial information and project entry point.

## Projects

Purpose: Central operational workspace.

Contains: - Overview - Kanban - Tasks - Calendar - Files - Notes -
Activity

## Calendar

Purpose: Deadline management.

Views: - Month - Week - Agenda

## Users

Purpose: Team management.

## Settings

Purpose: Application configuration.

------------------------------------------------------------------------

# Data Relationships

``` text
Client
 ├── Quotations
 └── Projects
      ├── Tasks
      ├── Files
      ├── Notes
      └── Activity
```

Rules:

-   One Client → Many Projects
-   One Project → Many Tasks
-   One Task → One Assignee

------------------------------------------------------------------------

# URL Structure

``` text
/dashboard
/clients
/clients/{clientId}
/projects
/projects/{projectId}
/projects/{projectId}/kanban
/projects/{projectId}/tasks
/calendar
/users
/settings
```

------------------------------------------------------------------------

# Breadcrumb Example

``` text
Dashboard > Clients > Cafe Elam > Website > Homepage Task
```

------------------------------------------------------------------------

# Search

Global search indexes:

-   Clients
-   Projects
-   Tasks
-   Contacts

Future: - Notes - Quotations - Comments

------------------------------------------------------------------------

# Responsive Design

## Desktop

12-column layout.

## Tablet

8-column layout.

## Mobile

Single-column layout.

Kanban may scroll horizontally.

------------------------------------------------------------------------

# Kanban

Project and Task Kanban support:

-   Drag-and-drop
-   Automatic status updates
-   Card reordering
-   Sticky headers

------------------------------------------------------------------------

# Loading States

Use skeleton placeholders.

------------------------------------------------------------------------

# Empty States

Each page should explain what to do next and include a primary action.

------------------------------------------------------------------------

# Error States

Friendly error messages with retry actions when possible.

------------------------------------------------------------------------

# Accessibility

-   Keyboard navigation
-   WCAG AA contrast
-   44×44px touch targets
-   Semantic HTML
-   ARIA labels

------------------------------------------------------------------------

# Module Dependencies

``` text
Users
 ↓
Clients
 ↓
Projects
 ↓
Tasks
 ↓
Calendar
```

Projects require Clients.

Tasks require Projects.

------------------------------------------------------------------------

# Architecture Decisions

1.  Projects are the operational center.
2.  Clients provide commercial context.
3.  Kanban is a first-class workflow.
4.  Google Drive is the external file repository.
5.  Responsive behavior is mandatory.

------------------------------------------------------------------------

# Acceptance Criteria

-   Consistent navigation across devices.
-   Three-click access to common actions.
-   Predictable URLs.
-   Always-available search.
-   Simple, scalable information hierarchy.
