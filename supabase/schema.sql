-- ========================================================
-- SAT AGENCY SUITE - PRODUCTION SUPABASE DATABASE SCHEMA
-- Execute this SQL script inside your Supabase SQL Editor
-- ========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AGENCY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_name TEXT NOT NULL DEFAULT 'EMAC Agency',
  default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  drive_root_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Agency Settings if missing
INSERT INTO agency_settings (agency_name, default_currency, drive_root_url)
SELECT 'EMAC Agency', 'INR', 'https://drive.google.com/drive/folders/emac-agency-root'
WHERE NOT EXISTS (SELECT 1 FROM agency_settings);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'employee', 'freelancer')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  address TEXT,
  industry TEXT DEFAULT 'Digital Agency Services',
  status VARCHAR(30) NOT NULL DEFAULT 'won' CHECK (status IN ('lead', 'discussion', 'proposal_sent', 'won', 'in_progress', 'completed', 'support', 'inactive')),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  notes TEXT,
  drive_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  quotation_number VARCHAR(50) NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  advance_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  remarks TEXT,
  drive_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PAYMENT RECORDS TABLE
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'waiting', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')),
  start_date DATE,
  due_date DATE,
  drive_url TEXT,
  enable_content_planner BOOLEAN DEFAULT false,
  content_planner_share_token TEXT UNIQUE,
  client_permissions JSONB DEFAULT '{"allow_approval": true, "allow_comments": true, "allow_rescheduling": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'completed')),
  due_date DATE,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CONTENT ITEMS TABLE
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform VARCHAR(30) NOT NULL,
  content_type VARCHAR(30) NOT NULL,
  scheduled_date DATE NOT NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  caption TEXT,
  drive_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'writing', 'design', 'review', 'revision_requested', 'approved', 'scheduled', 'published', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CONTENT ANNOTATIONS & FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS content_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (author_role IN ('client', 'agency')),
  comment TEXT NOT NULL,
  suggested_drive_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(30) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(30) NOT NULL,
  details TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. MASTER AGENCY STATE TABLE (REQUIRED FOR CROSS-DEVICE & MULTI-USER CLOUD SYNC)
CREATE TABLE IF NOT EXISTS agency_state (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_state ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for public / API calls
DROP POLICY IF EXISTS "Allow select settings" ON agency_settings;
CREATE POLICY "Allow select settings" ON agency_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update settings" ON agency_settings;
CREATE POLICY "Allow update settings" ON agency_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow all on users" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on clients" ON clients;
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on quotations" ON quotations;
CREATE POLICY "Allow all on quotations" ON quotations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on payment_records" ON payment_records;
CREATE POLICY "Allow all on payment_records" ON payment_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on projects" ON projects;
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on content_items" ON content_items;
CREATE POLICY "Allow all on content_items" ON content_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on content_annotations" ON content_annotations;
CREATE POLICY "Allow all on content_annotations" ON content_annotations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on activity_logs" ON activity_logs;
CREATE POLICY "Allow all on activity_logs" ON activity_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on agency_state" ON agency_state;
CREATE POLICY "Allow all on agency_state" ON agency_state FOR ALL USING (true) WITH CHECK (true);

-- ENABLE SUPABASE REALTIME FOR INSTANT MULTI-USER SYNC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'agency_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE agency_state;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

