-- Trust-fund compliance: dedicated-account tracking, lien waiver attachment,
-- and milestone-gated draw approval. Run in Supabase SQL Editor.
-- https://supabase.com/dashboard/project/cmvvghgzsvfsfqdfgrpx/sql/new

-- 1. Which dedicated bank sub-account (Relay/Mercury/Novo) holds this project's funds.
ALTER TABLE draw_projects
  ADD COLUMN IF NOT EXISTS bank_sub_account_label TEXT;

-- 2. Lien waiver attachment + milestone confirmation, required before a draw
--    can move to 'approved' (enforced in the API, see draws/[id]/route.ts).
ALTER TABLE draw_requests
  ADD COLUMN IF NOT EXISTS waiver_file_url TEXT,
  ADD COLUMN IF NOT EXISTS waiver_file_name TEXT,
  ADD COLUMN IF NOT EXISTS milestone_label TEXT,
  ADD COLUMN IF NOT EXISTS milestone_confirmed BOOLEAN DEFAULT FALSE;

-- 3. Storage bucket for lien waiver documents (private; admin uploads via
--    service-role, so no public bucket policy needed).
INSERT INTO storage.buckets (id, name, public)
VALUES ('lien-waivers', 'lien-waivers', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Branding drift: contracts/legal docs use plain "Southern Cities
--    Construction", no LLC suffix. Fix the column default and any rows
--    still on the old default.
ALTER TABLE draw_projects ALTER COLUMN gc_name SET DEFAULT 'Southern Cities Construction';
UPDATE draw_projects SET gc_name = 'Southern Cities Construction' WHERE gc_name = 'Southern Cities Construction LLC';
