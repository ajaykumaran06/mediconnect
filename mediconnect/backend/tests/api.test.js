/**
 * MediConnect Backend — Integration Tests
 *
 * Run:  npm test
 *
 * Uses Jest + Supertest against the actual Express app.
 * Set TEST_* env vars or copy .env.test.example to .env.test
 *
 * NOTE: These tests hit a real Supabase test project.
 * Use a separate "test" Supabase project to avoid polluting production data.
 */

const request = require('supertest');
const app = require('../server');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timestamp = Date.now();
const patientEmail = `patient_test_${timestamp}@mc.test`;
const doctorEmail  = `doctor_test_${timestamp}@mc.test`;

let patientToken = '';
let doctorToken  = '';
let patientId    = '';
let doctorId     = '';
let appointmentId = '';
let prescriptionId = '';

// ─── AUTH ─────────────────────────────────────────────────────────────────────
describe('Auth', () => {
  test('POST /api/auth/signup — patient registration', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test Patient',
        email: patientEmail,
        password: 'TestPass123!',
        age: 30,
        phone: '+919876543210',
        language: 'en',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('patient');
    patientToken = res.body.token;
    patientId = res.body.user.id;
  });

  test('POST /api/auth/signup — duplicate email returns 409', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Dup User',
        email: patientEmail,
        password: 'TestPass123!',
        age: 25,
        phone: '+919876543211',
      });
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login — valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: patientEmail, password: 'TestPass123!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(patientEmail);
  });

  test('POST /api/auth/login — wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: patientEmail, password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — authenticated user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(patientEmail);
  });

  test('GET /api/auth/me — no token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ─── DOCTORS ─────────────────────────────────────────────────────────────────
describe('Doctors', () => {
  test('GET /api/doctors — public list (no auth required)', async () => {
    const res = await request(app).get('/api/doctors');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('doctors');
    expect(Array.isArray(res.body.doctors)).toBe(true);
  });

  test('GET /api/doctors — filter by specialization', async () => {
    const res = await request(app)
      .get('/api/doctors')
      .query({ specialization: 'Cardiologist' });
    expect(res.status).toBe(200);
    // All returned doctors should be Cardiologists
    res.body.doctors.forEach((d) => {
      expect(d.specialization).toBe('Cardiologist');
    });
  });

  test('GET /api/doctors/meta/specializations', async () => {
    const res = await request(app).get('/api/doctors/meta/specializations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.specializations)).toBe(true);
  });
});

// ─── SYMPTOM CHECKER ─────────────────────────────────────────────────────────
describe('Symptoms', () => {
  test('POST /api/symptoms/check — known symptoms', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['fever', 'headache'] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('suggestions');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions[0]).toHaveProperty('specialist');
    expect(res.body.suggestions[0]).toHaveProperty('urgency');
  });

  test('POST /api/symptoms/check — empty array returns 400', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: [] });
    expect(res.status).toBe(400);
  });

  test('POST /api/symptoms/check — unknown symptom returns default', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['xyzunknownsymptom123'] });
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(0);
    expect(res.body).toHaveProperty('defaultSpecialist');
  });

  test('POST /api/symptoms/check — chest pain is high urgency', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['chest pain'] });
    expect(res.status).toBe(200);
    const primary = res.body.primarySuggestion;
    expect(primary.urgency).toBe('high');
    expect(primary.specialist).toBe('Cardiologist');
  });
});

// ─── APPOINTMENTS (requires patient auth + a real approved doctor in DB) ─────
describe('Appointments', () => {
  test('GET /api/appointments/user — patient can fetch own appointments', async () => {
    const res = await request(app)
      .get('/api/appointments/user')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.appointments)).toBe(true);
  });

  test('GET /api/appointments/user — no auth returns 401', async () => {
    const res = await request(app).get('/api/appointments/user');
    expect(res.status).toBe(401);
  });

  test('POST /api/appointments — invalid data returns 400', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId: 'not-a-uuid', date: 'invalid-date', time: '99:99' });
    expect(res.status).toBe(400);
  });
});

// ─── ADMIN ROUTES (require admin JWT — set TEST_ADMIN_TOKEN in env) ───────────
describe('Admin (if admin token available)', () => {
  const adminToken = process.env.TEST_ADMIN_TOKEN;

  // Skip all admin tests if no admin token provided
  const maybeTest = adminToken ? test : test.skip;

  maybeTest('GET /api/admin/analytics — admin can view platform stats', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('appointments');
    expect(res.body).toHaveProperty('prescriptions');
  });

  maybeTest('GET /api/admin/doctors/pending — admin can list pending doctors', async () => {
    const res = await request(app)
      .get('/api/admin/doctors/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.doctors)).toBe(true);
  });

  maybeTest('GET /api/admin/users — patient token cannot access admin route', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
describe('Server', () => {
  test('GET /api/health — returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
