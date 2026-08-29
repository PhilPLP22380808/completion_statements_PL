// Money + date formatting helpers, shared across the app.

// Round to whole pence, avoiding binary-float drift (e.g. 1.005 -> 1.01).
export function round2(value) {
  const n = Number(value);
  if (!isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Parse a user-entered money string ("1,234.50", "-40", "") into a Number.
// Returns 0 for anything unparseable.
export function parseMoney(value) {
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

// Add thousands separators as the user types, preserving a trailing "." or decimals.
export function formatWithCommas(value) {
  const raw = String(value).replace(/[^0-9.-]/g, '');
  const negative = raw.startsWith('-');
  const digits = raw.replace(/-/g, '');
  const parts = digits.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + parts.join('.');
}

// £1,234.50 with two decimals. Returns a placeholder for null/NaN.
export function formatCurrency(value, { blankDash = true } = {}) {
  if (value === null || value === undefined || isNaN(value)) return blankDash ? '-' : '';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(round2(value));
}

// 1,234.50 with no symbol, two decimals (for ledger columns).
export function formatAmount(value) {
  if (value === null || value === undefined || isNaN(value)) return '';
  return new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(round2(value));
}

// 28th August 2026
export function formatLongDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  const day = d.getUTCDate();
  const month = d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = d.getUTCFullYear();
  return `${day}${ordinal(day)} ${month} ${year}`;
}

// 28/08/2026
export function formatShortDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

// "end of August 2026"
export function formatMonthYear(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  const month = d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  return `${month} ${d.getUTCFullYear()}`;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
