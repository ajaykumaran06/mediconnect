const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// GET /api/admin/doctors/pending — Doctors awaiting approval
router.get('/doctors/pending', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select(`*, users!inner(id, name, email, created_at)`)
      .eq('approved', false);

    if (error) throw error;
    res.json({ doctors: data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/doctors/:userId/approve
router.put('/doctors/:userId/approve', async (req, res, next) => {
  try {
    const { approved } = req.body;

    const { data, error } = await supabase
      .from('doctors')
      .update({ approved: Boolean(approved) })
      .eq('user_id', req.params.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ doctor: data, message: approved ? 'Doctor approved' : 'Doctor rejected' });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users — All users
router.get('/users', async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ users: data, total: count });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id — Remove user
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User removed' });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics — Platform stats
router.get('/analytics', async (req, res, next) => {
  try {
    const [users, doctors, appointments, prescriptions] = await Promise.all([
      supabase.from('users').select('role', { count: 'exact' }),
      supabase.from('doctors').select('approved', { count: 'exact' }),
      supabase.from('appointments').select('status', { count: 'exact' }),
      supabase.from('prescriptions').select('id', { count: 'exact' }),
    ]);

    // Count by role
    const patientCount = users.data?.filter((u) => u.role === 'patient').length || 0;
    const doctorCount = users.data?.filter((u) => u.role === 'doctor').length || 0;
    const pendingDoctors = doctors.data?.filter((d) => !d.approved).length || 0;

    // Count by appointment status
    const apptByStatus = {};
    appointments.data?.forEach(({ status }) => {
      apptByStatus[status] = (apptByStatus[status] || 0) + 1;
    });

    res.json({
      users: { total: users.count, patients: patientCount, doctors: doctorCount },
      doctors: { total: doctorCount, pending: pendingDoctors },
      appointments: { total: appointments.count, byStatus: apptByStatus },
      prescriptions: { total: prescriptions.count },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
