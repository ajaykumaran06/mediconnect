const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

/**
 * Notifications are stored in the `notifications` table.
 * They are created by the system (e.g. appointment booked, status changed).
 * Doctors and patients each see their own notifications.
 */

// GET /api/notifications — fetch unread + recent notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    const unreadCount = data.filter((n) => !n.read).length;
    res.json({ notifications: data, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read — mark single notification as read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id) // Ensure ownership
      .select()
      .single();

    if (error) throw error;
    res.json({ notification: data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);

    if (error) throw error;
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * Internal helper — call this from other routes to create a notification.
 * E.g. createNotification(doctorId, 'New appointment booked', 'appointment', appointmentId)
 */
async function createNotification(userId, message, type = 'info', referenceId = null) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      message,
      type,           // 'appointment' | 'prescription' | 'info' | 'alert'
      reference_id: referenceId,
      read: false,
    });
  } catch (err) {
    console.warn('[Notification] Failed to create:', err.message);
  }
}

module.exports = router;
module.exports.createNotification = createNotification;
