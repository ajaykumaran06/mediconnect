const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/prescriptions — Create prescription (doctors only)
router.post('/', authenticate, authorize('doctor'), [
  body('appointmentId').notEmpty(),
  body('patientId').notEmpty(),
  body('diagnosis').notEmpty().withMessage('Diagnosis required'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine required'),
  body('medicines.*.name').notEmpty(),
  body('medicines.*.dosage').notEmpty(),
  body('medicines.*.instructions').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { appointmentId, patientId, diagnosis, medicines, notes } = req.body;

    // Verify doctor owns the appointment
    const { data: appt } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('doctor_id', req.user.id)
      .single();

    if (!appt) return res.status(403).json({ error: 'Appointment not found or unauthorized' });

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert({
        appointment_id: appointmentId,
        doctor_id: req.user.id,
        patient_id: patientId,
        diagnosis,
        medicines: medicines,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Mark appointment as completed
    await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId);

    res.status(201).json({ prescription });
  } catch (err) {
    next(err);
  }
});

// GET /api/prescriptions/:patientId — Get patient's prescriptions
router.get('/:patientId', authenticate, async (req, res, next) => {
  try {
    // Patients can only view their own; doctors/admins can view any
    if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctor:doctor_id(
          name,
          doctors (specialization)
        ),
        appointment:appointment_id(date, time)
      `)
      .eq('patient_id', req.params.patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ prescriptions: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/prescriptions/download/:id — Generate and download PDF
router.get('/download/:id', authenticate, async (req, res, next) => {
  try {
    const { data: rx, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctor:doctor_id(name, doctors(specialization, hospital)),
        patient:patient_id(name),
        appointment:appointment_id(date, time)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !rx) return res.status(404).json({ error: 'Prescription not found' });

    // Auth check
    if (req.user.role === 'patient' && rx.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let y = height - 60;

    // Header
    page.drawText('MediConnect', { x: 50, y, size: 24, font: boldFont, color: rgb(0.04, 0.49, 0.47) });
    y -= 20;
    page.drawText('Rural Health Access Platform', { x: 50, y, size: 12, font, color: rgb(0.5, 0.5, 0.5) });
    y -= 30;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 30;

    // Doctor & date info
    page.drawText(`Dr. ${rx.doctor.name}`, { x: 50, y, size: 14, font: boldFont });
    page.drawText(`Date: ${rx.appointment.date}`, { x: width - 200, y, size: 11, font });
    y -= 18;
    page.drawText(rx.doctor.doctors?.[0]?.specialization || rx.doctor.doctors?.specialization || '', { x: 50, y, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 40;

    // Patient info
    page.drawText('Patient:', { x: 50, y, size: 12, font: boldFont });
    page.drawText(rx.patient.name, { x: 120, y, size: 12, font });
    y -= 30;

    // Diagnosis
    page.drawText('Diagnosis:', { x: 50, y, size: 12, font: boldFont });
    y -= 18;
    page.drawText(rx.diagnosis, { x: 50, y, size: 11, font });
    y -= 30;

    // Medicines
    page.drawText('Prescribed Medicines:', { x: 50, y, size: 12, font: boldFont });
    y -= 20;

    const medicines = Array.isArray(rx.medicines) ? rx.medicines : JSON.parse(rx.medicines || '[]');
    medicines.forEach((med, i) => {
      page.drawText(`${i + 1}. ${med.name}`, { x: 60, y, size: 11, font: boldFont });
      y -= 16;
      page.drawText(`   Dosage: ${med.dosage}`, { x: 60, y, size: 10, font });
      y -= 14;
      page.drawText(`   Instructions: ${med.instructions}`, { x: 60, y, size: 10, font });
      y -= 20;
    });

    if (rx.notes) {
      y -= 10;
      page.drawText('Notes:', { x: 50, y, size: 12, font: boldFont });
      y -= 18;
      page.drawText(rx.notes, { x: 50, y, size: 11, font });
    }

    // Footer
    page.drawText('This prescription is generated digitally by MediConnect.', {
      x: 50, y: 60, size: 9, font, color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${rx.id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
