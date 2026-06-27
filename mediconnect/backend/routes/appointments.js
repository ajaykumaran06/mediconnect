const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const { sendAppointmentEmail } = require('../services/emailService');
const { createNotification } = require('./notifications');

// POST /api/appointments — Book appointment (patients)
router.post('/', authenticate, authorize('patient'), [
  body('doctorId').notEmpty().withMessage('Doctor ID required'),
  body('date').isDate().withMessage('Valid date required (YYYY-MM-DD)'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required (HH:MM)'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { doctorId, date, time, notes } = req.body;

    // Check slot availability
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'cancelled')
      .single();

    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: req.user.id,
        doctor_id: doctorId,
        date,
        time,
        notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Optional: send confirmation email
    try {
      await sendAppointmentEmail(req.user.email, appointment);
    } catch (emailErr) {
      console.warn('Email notification failed:', emailErr.message);
    }

    // Notify the doctor
    try {
      await createNotification(
        doctorId,
        `New appointment booked by ${req.user.name} on ${date} at ${time}`,
        'appointment',
        appointment.id
      );
    } catch (_) { }

    res.status(201).json({ appointment });
  } catch (err) {
    next(err);
  }
});

// GET /api/appointments/user — Patient's appointments
router.get('/user', authenticate, authorize('patient'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id(
          name,
          doctors (specialization, hospital)
        )
      `)
      .eq('patient_id', req.user.id)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json({ appointments: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/appointments/doctor — Doctor's appointments
router.get('/doctor', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id(
          name, 
          email,
          patients (age, phone, language)
        )
      `)
      .eq('doctor_id', req.user.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    res.json({ appointments: data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/appointments/:id/status — Update appointment status
router.put('/:id/status', authenticate, authorize('doctor', 'patient'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    }

    // Fetch appointment to verify ownership
    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !appt) return res.status(404).json({ error: 'Appointment not found' });

    // Patients can only cancel their own; doctors can change any status
    if (req.user.role === 'patient') {
      if (appt.patient_id !== req.user.id) {
        return res.status(403).json({ error: 'Not your appointment' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Patients can only cancel appointments' });
      }
    }

    if (req.user.role === 'doctor' && appt.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your appointment' });
    }

    const { data: updated, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ appointment: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { data: appt } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.patient_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
});


// PUT /api/appointments/:id/reschedule
router.put('/:id/reschedule', authenticate, authorize('patient', 'doctor'), [
  body('date').isDate().withMessage('Valid date required (YYYY-MM-DD)'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required (HH:MM)'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { date, time } = req.body;

    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !appt) return res.status(404).json({ error: 'Appointment not found' });

    const owns = req.user.role === 'patient'
      ? appt.patient_id === req.user.id
      : appt.doctor_id === req.user.id;
    if (!owns && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    // Conflict check
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', appt.doctor_id)
      .eq('date', date)
      .eq('time', time)
      .neq('id', req.params.id)
      .neq('status', 'cancelled')
      .single();

    if (conflict) return res.status(409).json({ error: 'That time slot is already booked' });

    const { data: updated, error: updateErr } = await supabase
      .from('appointments')
      .update({ date, time, status: 'rescheduled' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ appointment: updated });
  } catch (err) {
    next(err);
  }
});


// GET /api/appointments/slots — available slots for a doctor on a date
const ALL_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];
router.get('/slots', async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }
    const { data, error } = await supabase
      .from('appointments')
      .select('time')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .neq('status', 'cancelled');

    if (error) throw error;
    const bookedSlots = data.map((a) => a.time.slice(0, 5));
    const availableSlots = ALL_SLOTS.filter((s) => !bookedSlots.includes(s));
    res.json({ bookedSlots, availableSlots, date, doctorId });
  } catch (err) { next(err); }
});

module.exports = router;
