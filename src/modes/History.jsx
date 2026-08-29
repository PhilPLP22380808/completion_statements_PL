import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Trash2, Clock } from 'lucide-react';
import { colors } from '../theme';
import Brand from '../components/Brand';
import { listHistory, deleteHistoryEntry, clearHistory, timeAgo } from '../lib/history';

const MODE_LABEL = {
  apportionment: 'Apportionment',
  purchase: 'Purchase',
  sale: 'Sale',
  linked: 'Linked sale & purchase',
};

export default function History({ onHome, onReload }) {
  const [entries, setEntries] = useState(() => listHistory());

  const refresh = () => setEntries(listHistory());
  const remove = (id) => { deleteHistoryEntry(id); refresh(); };
  const clearAll = () => {
    if (window.confirm('Clear the whole history? Saved statement files are not affected.')) {
      clearHistory();
      refresh();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #faf8f8 0%, #f5f0f1 100%)', fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ background: 'white', borderBottom: `3px solid ${colors.burgundy}`, padding: '16px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Brand label="History" />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onHome} style={btnGhost}><ArrowLeft size={16} /> Back to start</button>
            {entries.length > 0 && <button onClick={clearAll} style={btnGhost}>Clear history</button>}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Clock size={22} color={colors.burgundy} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.ink, margin: 0 }}>Recent runs</h1>
        </div>
        <p style={{ color: colors.muted, fontSize: 14, marginBottom: 24 }}>
          The last {100} statements exported on this computer. Reload one to pick up where it was left off.
          This history is stored in this browser only and is not shared with colleagues.
        </p>

        {entries.length === 0 ? (
          <div style={{ background: 'white', border: `1px solid ${colors.line}`, borderRadius: 12, padding: 40, textAlign: 'center', color: colors.faint }}>
            Nothing here yet. Statements you export will show up in this list.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {entries.map((e) => (
              <div key={e.id} style={{ background: 'white', border: `1px solid ${colors.line}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: colors.burgundy, background: colors.panel, borderRadius: 5, padding: '2px 7px' }}>{MODE_LABEL[e.mode] || e.mode}</span>
                    <span style={{ fontSize: 11, color: e.status === 'Final' ? colors.positive : colors.faint, fontWeight: 600 }}>{e.status}</span>
                    <span style={{ fontSize: 12, color: colors.faint }}>· {timeAgo(e.savedAt)}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div style={{ fontSize: 12.5, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.subtitle}{e.subtitle && e.balanceLabel ? '  ·  ' : ''}{e.balanceLabel}
                  </div>
                </div>
                <button onClick={() => onReload(e)} style={btnPrimary}><RotateCcw size={15} /> Reload</button>
                <button onClick={() => remove(e.id)} title="Remove from history" style={{ padding: 8, background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', borderRadius: 8 }}>
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'white',
  color: colors.burgundy, border: `1px solid ${colors.blush}`, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: colors.burgundy,
  color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0,
};
