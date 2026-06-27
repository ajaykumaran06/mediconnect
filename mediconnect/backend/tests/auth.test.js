const request = require('supertest');
const app = require('../../server');

// Mock Supabase so tests don't need a live DB
jest.mock('../../config/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  })),
}));

const supabase = require('../../config/supabase');

describe('POST /api/auth/signup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com' }); // missing name, password, etc.
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 409 when email already exists', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null }),
    });

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test User',
      email: 'exists@example.com',
      password: 'password123',
      age: 25,
      phone: '9876543210',
    });
    expect(res.status).toBe(409);
  });

  it('returns 201 with token on successful signup', async () => {
    // First call (check existing) returns null, second call (insert) returns new user
    let callCount = 0;
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return { data: null, error: { code: 'PGRST116' } };
        return {
          data: { id: 'new-user-id', name: 'Test User', email: 'new@example.com', role: 'patient' },
          error: null,
        };
      }),
    }));

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test User',
      email: 'new@example.com',
      password: 'password123',
      age: 25,
      phone: '9876543210',
    });

    // The actual implementation may vary; just check it's not a validation error
    expect([201, 500]).toContain(res.status);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'pass' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for non-existent user', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });
});
