import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileDown, Building2 } from 'lucide-react';
import { colors, inputStyle } from '../theme';
import { TextInput, DateInput, Field, SectionCard } from '../components/fields';
import StatementForm from '../components/StatementForm';
import LedgerPreview from '../components/LedgerPreview';
import Brand from '../components/Brand';
import { newStatement, computeStatement } from '../lib/statement';
import { downloadCompletionSet } from '../lib/pdf';

const STORAGE_KEY = (t) => `pinnacle.statement.${t}`;

function loadState(matterType) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY(matterType));
    if (saved) return { ...newStatement(matterType), ...JSON.parse(saved), matterType };
  } catch (e) { /* ignore */ }
  return newStatement(matterType);
}

export default function StatementBuilder({ matterType, onHome }) {
  const [state, setState] = useState(() => loadState(matterType));

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY(matterType), JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, [matterType, state]);

  const set = (patch) => setState((s) => ({ ...s, ...patch }));
  const computed = useMemo(() => computeStatement(state), [state]);
  const isPurchase = matterType === 'purchase';

  const resetAll = () => {
    if (window.confirm('Clear this statement and start again?')) {
      const fresh = newStatement(matterType);
      setState(fresh);
      try { localStorage.setItem(STORAGE_KEY(matterType), JSON.stringify(fresh)); } catch (e) { /* ignore */ }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #faf8f8 0%, #f5f0f1 100%)', fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ background: 'white', borderBottom: `3px solid ${colors.burgundy}`, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(114,47,55,0.08)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Brand label={`${isPurchase ? 'Purchase' : 'Sale'} Completion Statement`} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onHome} style={btnGhost}><ArrowLeft size={16} /> Change task</button>
            <button onClick={resetAll} style={btnGhost}>Clear</button>
            <button onClick={() => downloadCompletionSet(state, computed)} style={btnPrimary}><FileDown size={18} /> Export PDF</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 28, alignItems: 'start' }}>
        <div>
          <SectionCard icon={Building2} title="Matter details">
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Client(s)"><TextInput value={state.clients} onChange={(e) => set({ clients: e.target.value })} placeholder="e.g. Jane Smith and John Smith" style={{ textAlign: 'left' }} /></Field>
              <Field label="Property address"><TextInput value={state.address} onChange={(e) => set({ address: e.target.value })} placeholder="Full property address" style={{ textAlign: 'left' }} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Our ref"><TextInput value={state.ourRef} onChange={(e) => set({ ourRef: e.target.value })} placeholder="AB/P/Smith-J" style={{ textAlign: 'left' }} /></Field>
                <Field label="Completion date (actual)"><DateInput value={state.completionDate} onChange={(e) => set({ completionDate: e.target.value })} /></Field>
                <Field label="Status">
                  <select value={state.status} onChange={(e) => set({ status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option>Draft</option><option>Final</option>
                  </select>
                </Field>
              </div>
            </div>
          </SectionCard>

          <StatementForm state={state} onChange={set} completionDate={state.completionDate} />
        </div>

        <div style={{ position: 'sticky', top: 96 }}>
          <LedgerPreview computed={computed} statement={state} />
        </div>
      </main>
    </div>
  );
}

const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'white',
  color: colors.burgundy, border: `1px solid ${colors.blush}`, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: colors.burgundy,
  color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
