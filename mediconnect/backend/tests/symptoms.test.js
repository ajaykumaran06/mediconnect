const request = require('supertest');
const app = require('../../server');

describe('POST /api/symptoms/check', () => {
  it('returns 400 when no symptoms array provided', async () => {
    const res = await request(app).post('/api/symptoms/check').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/symptoms/i);
  });

  it('returns 400 when symptoms is empty array', async () => {
    const res = await request(app).post('/api/symptoms/check').send({ symptoms: [] });
    expect(res.status).toBe(400);
  });

  it('returns suggestions for known symptoms', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['fever', 'headache'] });
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toBeDefined();
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('maps "chest pain" to Cardiologist with high urgency', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['chest pain'] });
    expect(res.status).toBe(200);
    const match = res.body.suggestions.find((s) => s.specialist === 'Cardiologist');
    expect(match).toBeDefined();
    expect(match.urgency).toBe('high');
  });

  it('maps "skin rash" to Dermatologist', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['skin rash'] });
    expect(res.status).toBe(200);
    const match = res.body.suggestions.find((s) => s.specialist === 'Dermatologist');
    expect(match).toBeDefined();
  });

  it('returns default suggestion for unknown symptoms', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['zygomorphic disorder xyz'] });
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(0);
    expect(res.body.defaultSpecialist).toBe('General Physician');
  });

  it('deduplicates specialist suggestions', async () => {
    // Both fever and fatigue → General Physician; should only appear once
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['fever', 'fatigue'] });
    expect(res.status).toBe(200);
    const specialists = res.body.suggestions.map((s) => s.specialist);
    const unique = new Set(specialists);
    expect(unique.size).toBe(specialists.length);
  });

  it('sorts results by urgency: high before medium before low', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['acne', 'headache', 'chest pain'] });
    expect(res.status).toBe(200);
    const urgencies = res.body.suggestions.map((s) => s.urgency);
    const order = { high: 0, medium: 1, low: 2 };
    for (let i = 0; i < urgencies.length - 1; i++) {
      expect(order[urgencies[i]]).toBeLessThanOrEqual(order[urgencies[i + 1]]);
    }
  });

  it('response includes a disclaimer', async () => {
    const res = await request(app)
      .post('/api/symptoms/check')
      .send({ symptoms: ['fever'] });
    expect(res.status).toBe(200);
    expect(res.body.disclaimer).toBeDefined();
    expect(typeof res.body.disclaimer).toBe('string');
  });
});
