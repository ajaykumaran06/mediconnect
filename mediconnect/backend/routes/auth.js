const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Generate JWT
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Validation rules
const patientSignupRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 characters'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Valid age required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('language').optional().isString(),
];

const doctorSignupRules = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('specialization').notEmpty().withMessage('Specialization required'),
  body('hospital').notEmpty().withMessage('Hospital required'),
  body('location').notEmpty().withMessage('Location (city) required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience in years required'),
  body('licenseNumber').notEmpty().withMessage('License number required'),
];

// POST /api/auth/signup
router.post('/signup', [...patientSignupRules], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, age, phone, language = 'en', role = 'patient' } = req.body;

    // Check if email exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, role })
      .select()
      .single();

    if (userErr) throw userErr;

    // Create patient profile
    await supabase.from('patients').insert({
      user_id: user.id,
      age,
      phone,
      language,
    });

    const token = generateToken(user.id, user.role);
    res.status(201).json({ token, user: { id: user.id, name, email, role } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/signup/doctor
router.post('/signup/doctor', [...doctorSignupRules], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, specialization, hospital, location, experience, licenseNumber } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, role: 'doctor' })
      .select()
      .single();

    if (userErr) throw userErr;

    await supabase.from('doctors').insert({
      user_id: user.id,
      specialization,
      hospital,
      location,
      experience,
      license_no: licenseNumber,
      approved: false, // Requires admin approval
    });

    res.status(201).json({
      message: 'Doctor account created. Pending admin approval.',
      user: { id: user.id, name, email, role: 'doctor' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check doctor approval
    if (user.role === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('approved')
        .eq('user_id', user.id)
        .single();

      if (!doctor?.approved) {
        return res.status(403).json({ error: 'Doctor account pending admin approval' });
      }
    }

    const token = generateToken(user.id, user.role);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout (stateless JWT — client clears token)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// PUT /api/auth/profile — Update own profile (name, phone, language)
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone(),
  body('language').optional().isString(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, phone, language } = req.body;

    // Update display name in users table
    if (name) {
      await supabase.from('users').update({ name }).eq('id', req.user.id);
    }

    // Update patient-specific fields
    if (phone || language) {
      await supabase
        .from('patients')
        .update({ ...(phone && { phone }), ...(language && { language }) })
        .eq('user_id', req.user.id);
    }

    const { data: updatedUser } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', req.user.id)
      .single();

    res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password — Change own password
router.put('/password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password min 8 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    // Fetch current hashed password
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password: hashed }).eq('id', req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
