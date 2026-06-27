/**
 * GET /api/appointments/slots?doctorId=&date=
 * Returns which time slots are already booked for a doctor on a given date,
 * so the frontend can grey them out in the booking UI.
 *
 * Response:
 *   { bookedSlots: ['10:00', '14:30'], availableSlots: ['09:00', '09:30', ...] }
 */

const ALL_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

module.exports = function registerSlotsRoute(router, supabase) {
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

      const bookedSlots = data.map((a) => a.time.slice(0, 5)); // normalize HH:MM
      const availableSlots = ALL_SLOTS.filter((s) => !bookedSlots.includes(s));

      res.json({ bookedSlots, availableSlots, date, doctorId });
    } catch (err) {
      next(err);
    }
  });
};
