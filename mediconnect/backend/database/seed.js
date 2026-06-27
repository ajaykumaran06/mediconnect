/**
 * MediConnect — Development Seed Script
 *
 * Populates a Supabase project with realistic sample data for testing.
 *
 * Usage:
 *   cp .env.example .env  (fill in SUPABASE_URL + SUPABASE_SERVICE_KEY)
 *   node database/seed.js
 *
 * WARNING: Deletes all existing seed data before inserting.
 *          Do NOT run against production.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const HASH = (pwd) => bcrypt.hashSync(pwd, 10);

// ─── Seed data ────────────────────────────────────────────────────────────────

const USERS = [
  // Admin
  { id: 'seed-admin-001', name: 'Admin User',       email: 'admin@mediconnect.health',    password: HASH('Admin@123'),   role: 'admin'   },
  // Doctors
  { id: 'seed-doc-001',   name: 'Priya Sharma',     email: 'dr.priya@mediconnect.health', password: HASH('Doctor@123'),  role: 'doctor'  },
  { id: 'seed-doc-002',   name: 'Rajesh Nair',      email: 'dr.rajesh@mediconnect.health',password: HASH('Doctor@123'),  role: 'doctor'  },
  { id: 'seed-doc-003',   name: 'Ananya Iyer',      email: 'dr.ananya@mediconnect.health',password: HASH('Doctor@123'),  role: 'doctor'  },
  { id: 'seed-doc-004',   name: 'Vikram Patel',     email: 'dr.vikram@mediconnect.health',password: HASH('Doctor@123'),  role: 'doctor'  },
  { id: 'seed-doc-005',   name: 'Sunita Reddy',     email: 'dr.sunita@mediconnect.health',password: HASH('Doctor@123'),  role: 'doctor'  },
  // Patients
  { id: 'seed-pat-001',   name: 'Arjun Mehta',      email: 'arjun@example.com',           password: HASH('Patient@123'), role: 'patient' },
  { id: 'seed-pat-002',   name: 'Kavya Krishnan',   email: 'kavya@example.com',           password: HASH('Patient@123'), role: 'patient' },
  { id: 'seed-pat-003',   name: 'Ravi Shankar',     email: 'ravi@example.com',            password: HASH('Patient@123'), role: 'patient' },
];

const DOCTORS = [
  { user_id: 'seed-doc-001', specialization: 'Cardiologist',     hospital: 'Apollo Hospitals, Chennai',     experience: 12, license_no: 'TN-MCI-2012-001', approved: true  },
  { user_id: 'seed-doc-002', specialization: 'General Physician', hospital: 'Government General Hospital',   experience: 8,  license_no: 'KL-MCI-2016-002', approved: true  },
  { user_id: 'seed-doc-003', specialization: 'Dermatologist',    hospital: 'Fortis Hospitals, Bangalore',   experience: 6,  license_no: 'KA-MCI-2018-003', approved: true  },
  { user_id: 'seed-doc-004', specialization: 'Neurologist',      hospital: 'AIIMS, Jodhpur',                experience: 15, license_no: 'RJ-MCI-2009-004', approved: true  },
  { user_id: 'seed-doc-005', specialization: 'Orthopedist',      hospital: 'Manipal Hospital, Vijayawada',  experience: 10, license_no: 'AP-MCI-2014-005', approved: false }, // pending
];

const PATIENTS = [
  { user_id: 'seed-pat-001', age: 28, phone: '+919876543201', language: 'en' },
  { user_id: 'seed-pat-002', age: 34, phone: '+919876543202', language: 'ta' },
  { user_id: 'seed-pat-003', age: 45, phone: '+919876543203', language: 'hi' },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow  = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const APPOINTMENTS = [
  { id: 'seed-appt-001', patient_id: 'seed-pat-001', doctor_id: 'seed-doc-001', date: tomorrow,  time: '10:00', status: 'confirmed', notes: 'Chest tightness for 2 days' },
  { id: 'seed-appt-002', patient_id: 'seed-pat-002', doctor_id: 'seed-doc-002', date: today,     time: '11:30', status: 'pending',   notes: 'Follow-up fever' },
  { id: 'seed-appt-003', patient_id: 'seed-pat-003', doctor_id: 'seed-doc-001', date: yesterday, time: '14:00', status: 'completed', notes: 'Routine cardiac check' },
  { id: 'seed-appt-004', patient_id: 'seed-pat-001', doctor_id: 'seed-doc-003', date: yesterday, time: '09:30', status: 'completed', notes: 'Skin rash on forearm' },
  { id: 'seed-appt-005', patient_id: 'seed-pat-002', doctor_id: 'seed-doc-004', date: tomorrow,  time: '15:00', status: 'pending',   notes: 'Recurring migraines' },
];

const PRESCRIPTIONS = [
  {
    id: 'seed-rx-001',
    appointment_id: 'seed-appt-003',
    doctor_id:   'seed-doc-001',
    patient_id:  'seed-pat-003',
    diagnosis: 'Mild Hypertension',
    medicines: JSON.stringify([
      { name: 'Amlodipine 5mg', dosage: '1 tablet once daily', instructions: 'Take in the morning with water' },
      { name: 'Aspirin 75mg',   dosage: '1 tablet once daily', instructions: 'Take after breakfast' },
    ]),
    notes: 'Monitor blood pressure daily. Reduce salt intake. Follow up in 4 weeks.',
  },
  {
    id: 'seed-rx-002',
    appointment_id: 'seed-appt-004',
    doctor_id:   'seed-doc-003',
    patient_id:  'seed-pat-001',
    diagnosis: 'Allergic Contact Dermatitis',
    medicines: JSON.stringify([
      { name: 'Cetirizine 10mg',          dosage: '1 tablet at night',     instructions: 'Take before bed for 7 days' },
      { name: 'Betamethasone Cream 0.1%', dosage: 'Apply thin layer',      instructions: 'Apply to affected area twice daily for 5 days' },
    ]),
    notes: 'Avoid identified allergen. Keep area clean and dry.',
  },
];

// ─── Seed runner ─────────────────────────────────────────────────────────────

async function clearSeedData() {
  console.log('🗑  Clearing existing seed data…');
  const seedPatientIds = PATIENTS.map((p) => p.user_id);
  const seedDoctorIds  = DOCTORS.map((d) => d.user_id);
  const seedUserIds    = USERS.map((u) => u.id);

  await supabase.from('prescriptions').delete().in('id', PRESCRIPTIONS.map((r) => r.id));
  await supabase.from('appointments').delete().in('id', APPOINTMENTS.map((a) => a.id));
  await supabase.from('patients').delete().in('user_id', seedPatientIds);
  await supabase.from('doctors').delete().in('user_id', seedDoctorIds);
  await supabase.from('users').delete().in('id', seedUserIds);
}

async function seed() {
  try {
    await clearSeedData();

    console.log('👤 Inserting users…');
    const { error: usersErr } = await supabase.from('users').insert(USERS);
    if (usersErr) throw usersErr;

    console.log('🩺 Inserting doctor profiles…');
    const { error: doctorsErr } = await supabase.from('doctors').insert(DOCTORS);
    if (doctorsErr) throw doctorsErr;

    console.log('🙋 Inserting patient profiles…');
    const { error: patientsErr } = await supabase.from('patients').insert(PATIENTS);
    if (patientsErr) throw patientsErr;

    console.log('📅 Inserting appointments…');
    const { error: apptsErr } = await supabase.from('appointments').insert(APPOINTMENTS);
    if (apptsErr) throw apptsErr;

    console.log('💊 Inserting prescriptions…');
    const { error: rxErr } = await supabase.from('prescriptions').insert(PRESCRIPTIONS);
    if (rxErr) throw rxErr;

    console.log('\n✅  Seed complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('Test credentials (password same for all):');
    console.log('  Admin:   admin@mediconnect.health   / Admin@123');
    console.log('  Doctor:  dr.priya@mediconnect.health / Doctor@123');
    console.log('  Patient: arjun@example.com           / Patient@123');
    console.log('─────────────────────────────────────────\n');
  } catch (err) {
    console.error('❌  Seed failed:', err.message || err);
    process.exit(1);
  }
}

seed();
