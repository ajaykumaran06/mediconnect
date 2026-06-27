/**
 * PUT /api/appointments/:id/reschedule
 * Allows a patient or doctor to pick a new date+time.
 * Conflict-checks the new slot before saving.
 * Notifies the other party.
 *
 * Add this handler into routes/appointments.js
 * (Shown as a standalone file for clarity — paste before module.exports)
 */

// PUT /api/appointments/:id/reschedule
// router.put('/:id/reschedule', authenticate, authorize('patient', 'doctor'), async ...)

const rescheduleHandler = `
// PUT /api/appointments/:id/reschedule
router.put('/:id/reschedule', authenticate, authorize('patient', 'doctor'), [
  body('date').isDate().withMessage('Valid date required (YYYY-MM-DD)'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required (HH:MM)'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { date, time } = req.body;

    // Verify appointment exists and caller owns it
    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !appt) return res.status(404).json({ error: 'Appointment not found' });

    const owns = req.user.role === 'patient'
      ? appt.patient_id === req.user.id
      : appt.doctor_id  === req.user.id;
    if (!owns && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    // Check new slot isn't already taken
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', appt.doctor_id)
      .eq('date', date)
      .eq('time', time)
      .neq('id', req.params.id)          // exclude self
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

    // Notify the other party
    const notifyId = req.user.role === 'patient' ? appt.doctor_id : appt.patient_id;
    const actor    = req.user.role === 'patient' ? 'Patient' : 'Doctor';
    await createNotification(
      notifyId,
      \`\${actor} rescheduled appointment to \${date} at \${time}\`,
      'appointment',
      req.params.id
    ).catch(() => {});

    res.json({ appointment: updated });
  } catch (err) {
    next(err);
  }
});
`;

// This file is a reference snippet.
// The actual reschedule route has been integrated into routes/appointments.js
module.exports = { rescheduleHandler };
