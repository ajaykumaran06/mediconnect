const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');

jest.mock('../../config/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    range: jest.fn().mockReturnThis(),
  })),
}));

// Helper: generate a real JWT for testing
function makeToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'test-secret-key-32-chars-minimum', { expiresIn: '1h' });
}

const supabase = require('../../config/supabase');

describe('POST /api/appointments', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/appointments').send({
      doctorId: 'doctor-1',
      date: '2025-12-01',
      time: '10:00',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', name: 'Test', email: 't@t.com', role: 'patient' },
        error: null,
      }),
    });

    const token = makeToken('user-1', 'patient');
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: 'doctor-1' }); // missing date and time

    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid date format', async () => {
    const token = makeToken('user-1', 'patient');
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctorId: 'doc-1', date: 'not-a-date', time: '10:00' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/appointments/user', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/appointments/user');
    expect(res.status).toBe(401);
  });

  it('returns 403 for doctor trying to access patient endpoint', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'doc-1', name: 'Dr Test', email: 'd@t.com', role: 'doctor' },
        error: null,
      }),
    });

    const token = makeToken('doc-1', 'doctor');
    const res = await request(app)
      .get('/api/appointments/user')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/appointments/:id/status', () => {
  it('returns 400 for invalid status value', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', name: 'Test', email: 't@t.com', role: 'doctor' },
        error: null,
      }),
    });

    const token = makeToken('user-1', 'doctor');
    const res = await request(app)
      .put('/api/appointments/appt-1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'totally-invalid' });
    expect(res.status).toBe(400);
  });
});
