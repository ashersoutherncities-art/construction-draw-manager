-- Harden project access records used for multi-tenant project visibility.
-- Assumes application code normalizes emails to lowercase before insert/update.

CREATE UNIQUE INDEX IF NOT EXISTS idx_draw_project_access_project_email_unique
  ON draw_project_access(project_id, user_email);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'draw_project_access_role_check'
  ) THEN
    ALTER TABLE draw_project_access
      ADD CONSTRAINT draw_project_access_role_check
      CHECK (role IN ('viewer', 'manager'));
  END IF;
END $$;
