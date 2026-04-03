-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/cmvvghgzsvfsfqdfgrpx/sql/new

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects
CREATE TABLE IF NOT EXISTS draw_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  lender TEXT,
  loan_number TEXT,
  holdback_amount NUMERIC,
  total_construction_cost NUMERIC,
  original_budget NUMERIC,
  percent_complete NUMERIC DEFAULT 0,
  remaining_balance NUMERIC,
  total_drawn NUMERIC DEFAULT 0,
  gc_name TEXT DEFAULT 'Southern Cities Construction LLC',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draw Requests (from subs or internal)
CREATE TABLE IF NOT EXISTS draw_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES draw_projects(id) ON DELETE CASCADE,
  draw_number INTEGER,
  requested_by TEXT,
  requested_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  status TEXT DEFAULT 'pending',
  description TEXT,
  invoice_number TEXT,
  invoice_amount NUMERIC,
  lender_submission_date DATE,
  lender_approval_date DATE,
  payment_date DATE,
  denial_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Line items per draw
CREATE TABLE IF NOT EXISTS draw_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_request_id UUID REFERENCES draw_requests(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  description TEXT,
  budgeted_amount NUMERIC,
  requested_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_draw_requests_project_id ON draw_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_draw_requests_status ON draw_requests(status);
CREATE INDEX IF NOT EXISTS idx_draw_line_items_draw_id ON draw_line_items(draw_request_id);

-- Disable RLS (service role key bypasses anyway, but just in case)
ALTER TABLE draw_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE draw_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE draw_line_items DISABLE ROW LEVEL SECURITY;
