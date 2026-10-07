-- Queue lifecycle, office hours, and wait-time support.

ALTER TABLE offices
  ADD COLUMN IF NOT EXISTS opens_at time NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS closes_at time NOT NULL DEFAULT '16:00',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS average_service_minutes integer NOT NULL DEFAULT 10
    CHECK (average_service_minutes BETWEEN 1 AND 240);

ALTER TABLE queue_entries
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz;

-- Queue numbers are daily. This index also prevents duplicate numbers caused
-- by two students joining the same office at nearly the same time.
CREATE UNIQUE INDEX IF NOT EXISTS queue_entries_office_day_number_unique
ON queue_entries (office_id, ((joined_at AT TIME ZONE 'Africa/Lagos')::date), queue_number);

CREATE INDEX IF NOT EXISTS queue_entries_active_office_idx
ON queue_entries (office_id, status, joined_at);

-- Existing rows remain untouched; new queue numbers are calculated from today's rows only.
