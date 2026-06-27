const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/doctors — List approved doctors (public, with filters)
router.get('/', async (req, res, next) => {
  try {
    const { specialization, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('doctors')
      .select(`
        user_id,
        specialization,
        hospital,
        location,
        experience,
        consultation_fee,
        users!inner(id, name, email),
        approved
      `)
      .eq('approved', true)
      .range(offset, offset + limit - 1);

    if (specialization) query = query.eq('specialization', specialization);
    if (search) query = query.ilike('users.name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ doctors: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/meta/specializations — MUST be BEFORE /:id
router.get('/meta/specializations', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('specialization')
      .eq('approved', true);

    if (error) throw error;
    const unique = [...new Set(data.map((d) => d.specialization))].sort();
    res.json({ specializations: unique });
  } catch (err) {
    next(err);
  }
});

// PUT /api/doctors/profile — MUST be BEFORE /:id
router.put('/profile', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const { specialization, hospital, location, experience, bio, consultationFee, availableDays, name } = req.body;

    const doctorUpdate = {};
    if (specialization) doctorUpdate.specialization = specialization;
    if (hospital) doctorUpdate.hospital = hospital;
    if (location != null) doctorUpdate.location = location;
    if (experience != null) doctorUpdate.experience = Number(experience);
    if (bio != null) doctorUpdate.bio = bio;
    if (consultationFee != null) doctorUpdate.consultation_fee = Number(consultationFee);
    if (availableDays) doctorUpdate.available_days = availableDays;

    const { data, error } = await supabase
      .from('doctors')
      .update(doctorUpdate)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    if (name) {
      await supabase.from('users').update({ name }).eq('id', req.user.id);
    }

    res.json({ doctor: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/appointments/me — Doctor's own appointments (BEFORE /:id)
router.get('/appointments/me', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const { status, date } = req.query;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id(
          users!inner(name, email),
          age,
          phone
        )
      `)
      .eq('doctor_id', req.user.id)
      .order('date', { ascending: true });

    if (status) query = query.eq('status', status);
    if (date) query = query.eq('date', date);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ appointments: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:id — Single doctor profile (public) — MUST be AFTER specific routes
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        location,
        users!inner(id, name, email)
      `)
      .eq('user_id', req.params.id)
      .eq('approved', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ doctor: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
