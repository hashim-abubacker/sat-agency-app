# Simple Agency Tool (SAT)

**SAT** is a streamlined, modern agency management platform designed for digital agencies to manage clients, projects, tasks, content calendars, client approvals, and team collaboration.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Radix UI Primitives + Lucide React Icons
- **State & Data Fetching**: TanStack React Query v5
- **Form Management & Validation**: React Hook Form + Zod
- **Backend & Database**: Supabase (Authentication, PostgreSQL Database, Row-Level Security, Storage)
- **Deployment**: Vercel

---

## 📁 Project Structure

```text
├── 02_Product_Vision_and_Goals.md  # Product strategy & objectives
├── 04_Information_Architecture.md # Navigation & screen hierarchy
├── 05_Database_Schema.md           # Supabase SQL schemas & tables
├── 06_Roles_and_Permissions.md    # RBAC rules (Admin, PM, Client, etc.)
├── 07_Design_System.md            # UI design tokens & typography
├── Simple_Agency_Tool_PRD_v1.1.md # Full Product Requirements Document
├── AGENTS.md                      # AI Agent context & guidelines
├── supabase/                      # Supabase migrations & schema files
├── src/
│   ├── components/                # Modular UI components (Content, Clients, Tasks, etc.)
│   ├── hooks/                     # Custom React & keyboard shortcut hooks
│   ├── lib/                       # Supabase client setup & helper libraries
│   ├── pages/                     # Main view pages (Dashboard, Clients, Settings, etc.)
│   └── types/                     # TypeScript data interfaces
├── .env.example                   # Environment variable template
└── package.json                   # Project dependencies & scripts
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Installation
Clone or copy the repository to your local machine, then install dependencies:

```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

Set the following keys in `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Development Server
Start the Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🤖 AI Agent Guidelines

If you are using an AI coding assistant (Antigravity, Cursor, Claude Code, Windsurf), refer to [AGENTS.md](file:///AGENTS.md) for architecture rules, code conventions, and project state context.
