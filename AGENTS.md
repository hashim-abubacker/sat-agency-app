# AGENTS.md - Context & Instructions for AI Coding Agents

This document provides essential context, architectural rules, code conventions, and project status for AI Coding Agents working on the **Simple Agency Tool (SAT)** repository.

---

## 🎯 Project Overview

- **Name**: Simple Agency Tool (SAT)
- **Goal**: A clean, fast, and simple agency management web app inspired by Linear and Notion. Enables small digital agencies to manage clients, projects, tasks, content planning calendars, and client approval workflows.
- **Primary Backend**: Supabase (PostgreSQL, Row-Level Security, Auth, Storage).

---

## 🏗️ Architecture & Tech Stack

- **Framework**: React 19 (`react`, `react-dom`) + TypeScript (`~6.0`)
- **Build Tool**: Vite (`^8.1`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), Radix UI Primitives, `clsx`, `tailwind-merge`
- **Icons**: `lucide-react`
- **Routing**: `react-router-dom` v7
- **Forms & Validation**: `react-hook-form` + `@hookform/resolvers` + `zod`
- **State & Data Fetching**: `@tanstack/react-query` v5
- **Database Client**: `@supabase/supabase-js`

---

## 📋 Core Project Architecture & Rules

1. **Design & UX Principles**:
   - Clean, fast, low-friction UI (Linear/Notion aesthetic).
   - Dynamic dark/light themes.
   - Use Lucide icons consistently across components.
   - Keyboard shortcuts (`useKeyboardShortcuts.ts`) for common actions.

2. **Backend & Database Integration**:
   - Database tables & schema documentation are in `05_Database_Schema.md` and `supabase/` directory.
   - All Supabase client interactions use `@supabase/supabase-js` configured via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Respect Row Level Security (RLS) and user role types (`admin`, `project_manager`, `team_member`, `client`).

3. **Code Style & Type Safety**:
   - Strict TypeScript: maintain precise interfaces in `src/types/`.
   - Modular UI components inside `src/components/` grouped by feature area (`content/`, `clients/`, `tasks/`, `settings/`, etc.).
   - Use `zod` schemas for form input validation.

---

## 📁 Key Documentation References

When implementing or extending features, refer to these local reference files:
- [02_Product_Vision_and_Goals.md](file:///02_Product_Vision_and_Goals.md) — Strategic goals & features scope.
- [04_Information_Architecture.md](file:///04_Information_Architecture.md) — Screen hierarchy & navigation.
- [05_Database_Schema.md](file:///05_Database_Schema.md) — Supabase database tables & relations.
- [06_Roles_and_Permissions.md](file:///06_Roles_and_Permissions.md) — User roles & RBAC matrix.
- [07_Design_System.md](file:///07_Design_System.md) — Design tokens, color palette & typography.
- [Simple_Agency_Tool_PRD_v1.1.md](file:///Simple_Agency_Tool_PRD_v1.1.md) — Core PRD details.

---

## ⚙️ How to Run & Verify

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Typecheck and build verification
npm run build
```
