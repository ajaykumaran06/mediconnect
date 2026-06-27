-- MediConnect Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────
-- USERS (core auth table)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- PATIENTS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  user_id   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age       INTEGER CHECK (age > 0 AND age < 150),
  phone     TEXT,
  language  TEXT DEFAULT 'en'
);

-- ────────────────────────────────────────────────
-- DOCTORS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialization  TEXT NOT NULL,
  hospital        TEXT NOT NULL,
  experience      INTEGER NOT NULL CHECK (experience >= 0),
  license_no      TEXT UNIQUE NOT NULL,
  approved        BOOLEAN DEFAULT FALSE,
  bio             TEXT,
  consultation_fee NUMERIC(10, 2) DEFAULT 0.00,
  available_days  TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']
);

-- ────────────────────────────────────────────────
-- APPOINTMENTS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time        TIME NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','confirmed','completed','cancelled','rescheduled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, date, time) -- Prevent double booking
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON appointments(date);

-- ────────────────────────────────────────────────
-- PRESCRIPTIONS
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES users(id),
  patient_id      UUID NOT NULL REFERENCES users(id),
  diagnosis       TEXT NOT NULL,
  medicines       JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor  ON prescriptions(doctor_id);

-- ────────────────────────────────────────────────
-- MEDICAL RECORDS (file uploads)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);

-- ────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- NOTE: Since the backend uses the service role key, RLS is bypassed for server-side
-- requests. These policies apply to direct client-side Supabase queries (if any).

-- Users can read their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Patients can view their own patient profile
CREATE POLICY "patients_select_own" ON patients
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can view approved doctors (for listing)
CREATE POLICY "doctors_select_approved" ON doctors
  FOR SELECT USING (approved = TRUE);

-- ────────────────────────────────────────────────
-- SEED: Create admin user (change password before production!)
-- ────────────────────────────────────────────────
-- INSERT INTO users (name, email, password, role)
-- VALUES ('Admin', 'admin@mediconnect.health', '<bcrypt_hash>', 'admin');
