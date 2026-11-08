export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function deepMerge(base, patch) {
  if (!isObj(base) || !isObj(patch)) return patch === undefined ? base : patch;
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    out[k] = isObj(base[k]) && isObj(patch[k]) ? deepMerge(base[k], patch[k]) : patch[k];
  }
  return out;
}

// 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX -> 01XXXXXXXXX
export function normalizePhone(input = '') {
  const digits = String(input).replace(/[^\d]/g, '');
  const local = digits.startsWith('880') ? digits.slice(2) : digits;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}
export const toIntlPhone = (local) => `88${local}`;

// Start of "today" in Bangladesh time (UTC+6, no DST)
export function startOfTodayDhaka() {
  const shifted = new Date(Date.now() + 6 * 3600e3);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 6 * 3600e3);
}

export const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
