-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Add notifications table
-- Run this after schema.sql if upgrading an existing database
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'info'
               CHECK (type IN ('appointment', 'prescription', 'info', 'alert')),
  reference_id UUID,         -- optional: ID of related appointment/prescription
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id, read) WHERE read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users only see their own notifications
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Add bio, consultation_fee, available_days to doctors table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS bio               TEXT,
  ADD COLUMN IF NOT EXISTS consultation_fee  NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS available_days    TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'];
