const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
  },
});

// POST /api/upload/report — Upload medical report (optionally linked to appointment)
router.post('/report', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { appointmentId } = req.body;

    // If appointmentId provided, verify patient owns it & get doctor_id
    let doctorId = null;
    if (appointmentId) {
      const { data: appt } = await supabase
        .from('appointments')
        .select('doctor_id, patient_id')
        .eq('id', appointmentId)
        .single();

      if (!appt || appt.patient_id !== req.user.id) {
        return res.status(403).json({ error: 'Appointment not found or unauthorized' });
      }
      doctorId = appt.doctor_id;
    }

    const ext = req.file.originalname.split('.').pop();
    const filename = `reports/${req.user.id}/${uuidv4()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('medical-files')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage
      .from('medical-files')
      .getPublicUrl(filename);

    const { data: record, error: dbErr } = await supabase
      .from('medical_records')
      .insert({
        patient_id: req.user.id,
        file_url: urlData.publicUrl,
        file_name: req.file.originalname,
        appointment_id: appointmentId || null,
        doctor_id: doctorId,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    res.status(201).json({ record, url: urlData.publicUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/upload/records — Patient's own uploaded files
router.get('/records', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', req.user.id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json({ records: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/upload/patient-reports/:appointmentId — Doctor views reports for an appointment
router.get('/patient-reports/:appointmentId', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    // Verify doctor owns this appointment
    const { data: appt } = await supabase
      .from('appointments')
      .select('doctor_id, patient_id')
      .eq('id', appointmentId)
      .single();

    if (!appt || appt.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json({ reports: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/upload/all-reports — Doctor views all reports sent to them across appointments
router.get('/all-reports', authenticate, authorize('doctor'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patients:patient_id(users!inner(name))
      `)
      .eq('doctor_id', req.user.id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json({ reports: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
