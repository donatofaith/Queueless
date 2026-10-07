-- QueueLess multi-school staff authorization migration
-- Run this once against the same Neon database used by DATABASE_URL.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE offices ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

CREATE TABLE IF NOT EXISTS staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  office_id uuid REFERENCES offices(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, email)
);

CREATE INDEX IF NOT EXISTS staff_users_school_idx ON staff_users(school_id);
CREATE INDEX IF NOT EXISTS staff_users_office_idx ON staff_users(office_id);
CREATE INDEX IF NOT EXISTS offices_school_idx ON offices(school_id);

-- Create one initial school and attach legacy offices so existing queue data keeps working.
INSERT INTO schools (name, slug)
SELECT 'QueueLess Pilot School', 'pilot-school'
WHERE NOT EXISTS (SELECT 1 FROM schools);

UPDATE offices
SET school_id = (SELECT id FROM schools ORDER BY created_at ASC LIMIT 1)
WHERE school_id IS NULL;

ALTER TABLE offices ALTER COLUMN school_id SET NOT NULL;

-- Example initial staff account:
-- INSERT INTO staff_users (school_id, office_id, name, email, password_hash, role)
-- SELECT s.id, o.id, 'Office Staff', 'staff@school.edu',
--        crypt('CHANGE-ME-NOW', gen_salt('bf')), 'staff'
-- FROM schools s
-- JOIN offices o ON o.school_id = s.id
-- ORDER BY o.name ASC
-- LIMIT 1;
