// Recent-runs history, stored in the browser (localStorage). No backend.
// Each export of a statement or apportionment saves a snapshot here so the
// matter can be reloaded and edited without re-keying everything.
//
// Scope and limits: this is per browser, per machine. It is not shared between
// colleagues and is lost if the browser's site data is cleared. Capped at
// MAX_ENTRIES most-recent runs.

const KEY = 'pinnacle.history.v1';
const MAX_ENTRIES = 100;

// Where each mode keeps its live working copy. Reloading a history entry writes
// the snapshot into that key, then the builder picks it up when it mounts.
export const MODE_STORAGE_KEY = {
  apportionment: 'pinnacle.apportionment',
  purchase: 'pinnacle.statement.purchase',
  sale: 'pinnacle.statement.sale',
  linked: 'pinnacle.statement.linked',
};

export function restoreEntry(entry) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY[entry.mode], JSON.stringify(entry.state));
  } catch (e) { /* ignore */ }
  return entry.mode;
}

let seq = 0;
const uid = () => `h${Date.now().toString(36)}${(seq++).toString(36)}`;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    // Storage full or unavailable: drop the oldest half and try once more.
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, Math.floor(MAX_ENTRIES / 2))));
    } catch (e2) { /* give up quietly */ }
  }
}

export function listHistory() {
  return read();
}

export function getHistoryEntry(id) {
  return read().find((e) => e.id === id) || null;
}

/**
 * Save a snapshot.
 * @param {object} entry
 * @param {'apportionment'|'purchase'|'sale'|'linked'} entry.mode
 * @param {'Draft'|'Final'} entry.status
 * @param {object} entry.state       full state to restore into the builder
 * @param {string} entry.title       e.g. "Purchase — 3 Rubbra Close"
 * @param {string} entry.subtitle    e.g. "JT/P/Crosby-B · completes 28 Aug 2026"
 * @param {string} entry.balanceLabel e.g. "£2,815.58 due from you"
 */
export function addHistoryEntry({ mode, status, state, title, subtitle, balanceLabel }) {
  const list = read();
  list.unshift({
    id: uid(),
    savedAt: Date.now(),
    mode,
    status: status || 'Draft',
    title: title || 'Statement',
    subtitle: subtitle || '',
    balanceLabel: balanceLabel || '',
    state: JSON.parse(JSON.stringify(state)),
  });
  write(list.slice(0, MAX_ENTRIES));
}

export function deleteHistoryEntry(id) {
  write(read().filter((e) => e.id !== id));
}

export function clearHistory() {
  write([]);
}

// "just now", "12 minutes ago", "3 hours ago", "yesterday", "4 days ago", or a date.
export function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
