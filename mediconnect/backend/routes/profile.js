const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

/**
 * PUT /api/auth/profile
 * Update name, phone, preferred language for any authenticated user.
 */
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be blank'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('language').optional().isString(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, phone, language } = req.body;

    // Update users table
    if (name) {
      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', req.user.id);
      if (error) throw error;
    }

    // Update patient table fields
    if ((phone || language) && req.user.role === 'patient') {
      const updates = {};
      if (phone) updates.phone = phone;
      if (language) updates.language = language;
      const { error } = await supabase
        .from('patients')
        .update(updates)
        .eq('user_id', req.user.id);
      if (error) throw error;
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/password
 * Change password (requires current password verification).
 */
router.put('/password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    // Fetch current hashed password
    const { data: user, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password: hashed })
      .eq('id', req.user.id);

    if (updateErr) throw updateErr;

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
