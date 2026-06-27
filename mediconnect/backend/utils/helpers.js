/**
 * Shared utility helpers for MediConnect backend
 */

/**
 * Paginate a Supabase query result.
 * @param {number} page - 1-based page number
 * @param {number} limit - items per page (max 100)
 */
function getPagination(page = 1, limit = 20) {
  const safeLimit = Math.min(Number(limit) || 20, 100);
  const safePage  = Math.max(Number(page) || 1, 1);
  const from = (safePage - 1) * safeLimit;
  const to   = from + safeLimit - 1;
  return { from, to, limit: safeLimit, page: safePage };
}

/**
 * Strip undefined keys from an object (for clean Supabase updates).
 */
function cleanUpdate(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Format a Supabase error into a readable string.
 */
function formatDbError(error) {
  if (!error) return 'Unknown database error';
  if (error.code === '23505') return 'A record with this value already exists';
  if (error.code === '23503') return 'Referenced record does not exist';
  if (error.code === 'PGRST116') return 'Record not found';
  return error.message || 'Database error';
}

/**
 * Create a standard success envelope.
 */
function ok(data, meta = {}) {
  return { success: true, ...meta, ...data };
}

/**
 * Validate that a time string is HH:MM format.
 */
function isValidTime(str) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(str);
}

/**
 * Validate that a date string is YYYY-MM-DD and not in the past.
 */
function isValidFutureDate(str) {
  const d = new Date(str);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

module.exports = {
  getPagination,
  cleanUpdate,
  formatDbError,
  ok,
  isValidTime,
  isValidFutureDate,
};
