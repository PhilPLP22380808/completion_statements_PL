import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileDown, Building2, ShoppingCart, Home, ArrowDown } from 'lucide-react';
import { colors, inputStyle } from '../theme';
import { TextInput, DateInput, Field, SectionCard } from '../components/fields';
import StatementForm from '../components/StatementForm';
import LedgerPreview from '../components/LedgerPreview';
import Brand from '../components/Brand';
import { newLinked, computeLinked, normalizeStatus } from '../lib/statement';
import { downloadLinkedSet } from '../lib/pdf';
import { addHistoryEntry } from '../lib/history';
import { formatCurrency, formatShortDate } from '../lib/format';

const STORAGE_KEY = 'pinnacle.statement.linked';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const base = newLinked();
      const parsed = JSON.parse(saved);
      const merged = { ...base, ...parsed, sale: { ...base.sale, ...parsed.sale }, purchase: { ...base.purchase, ...parsed.purchase } };
      merged.status = normalizeStatus(merged.status);
      return merged;
    }
  } catch (e) { /* ignore */ }
  return newLinked();
}

export default function LinkedBuilder({ onHome }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, [state]);

  const set = (patch) => setState((s) => ({ ...s, ...patch }));
  const setSale = (patch) => setState((s) => ({ ...s, sale: { ...s.sale, ...patch } }));
  const setPurchase = (patch) => setState((s) => ({ ...s, purchase: { ...s.purchase, ...patch } }));

  const computed = useMemo(() => computeLinked(state), [state]);

  const resetAll = () => {
    if (window.confirm('Clear both statements and start again?')) {
      const fresh = newLinked();
      setState(fresh);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch (e) { /* ignore */ }
    }
  };

  const salePreview = computed.saleStatement;
  const purchasePreview = computed.purchaseStatement;

  const exportPdfs = () => {
    downloadLinkedSet(state, computed);
    const addr = state.purchase.address || state.sale.address;
    addHistoryEntry({
      mode: 'linked',
      status: state.status,
      state,
      title: `Linked${addr ? ` — ${addr}` : ''}`,
      subtitle: [state.clients, state.completionDate && `completes ${formatShortDate(state.completionDate)}`].filter(Boolean).join(' · '),
      balanceLabel: `Sale ${formatCurrency(computed.sale.absTotal)} · Purchase ${formatCurrency(computed.purchase.absTotal)} ${computed.purchase.direction === 'dueFromClient' ? 'due' : 'owed'}`,
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #faf8f8 0%, #f5f0f1 100%)', fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ background: 'white', borderBottom: `3px solid ${colors.burgundy}`, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(114,47,55,0.08)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Brand label="Linked Sale and Purchase" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onHome} style={btnGhost}><ArrowLeft size={16} /> Change task</button>
            <button onClick={resetAll} style={btnGhost}>Clear</button>
            <button onClick={exportPdfs} style={btnPrimary}><FileDown size={18} /> Export PDFs</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 28, alignItems: 'start' }}>
        <div>
          <SectionCard icon={Building2} title="Matter details (shared)">
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Client(s)"><TextInput value={state.clients} onChange={(e) => set({ clients: e.target.value })} placeholder="e.g. Jane Smith and John Smith" style={{ textAlign: 'left' }} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Completion date (actual)"><DateInput value={state.completionDate} onChange={(e) => set({ completionDate: e.target.value })} /></Field>
                <Field label="Status">
                  <select value={state.status} onChange={(e) => set({ status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option>Draft</option><option>Final</option>
                  </select>
                </Field>
              </div>
            </div>
          </SectionCard>

          <SideHeading icon={ShoppingCart} title="Sale" />
          <SectionCard icon={Building2} title="Sale property">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <Field label="Property address"><TextInput value={state.sale.address} onChange={(e) => setSale({ address: e.target.value })} placeholder="Property being sold" style={{ textAlign: 'left' }} /></Field>
              <Field label="Our ref"><TextInput value={state.sale.ourRef} onChange={(e) => setSale({ ourRef: e.target.value })} placeholder="AB/S/Smith-J" style={{ textAlign: 'left' }} /></Field>
            </div>
          </SectionCard>
          <StatementForm state={{ ...state.sale, matterType: 'sale' }} onChange={setSale} completionDate={state.completionDate} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 20px', color: colors.burgundy, fontWeight: 600, fontSize: 14 }}>
            <ArrowDown size={18} />
            Net sale proceeds carried into the purchase: {formatCurrency(computed.netProceeds)}
          </div>

          <SideHeading icon={Home} title="Purchase" />
          <SectionCard icon={Building2} title="Purchase property">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <Field label="Property address"><TextInput value={state.purchase.address} onChange={(e) => setPurchase({ address: e.target.value })} placeholder="Property being bought" style={{ textAlign: 'left' }} /></Field>
              <Field label="Our ref"><TextInput value={state.purchase.ourRef} onChange={(e) => setPurchase({ ourRef: e.target.value })} placeholder="AB/P/Smith-J" style={{ textAlign: 'left' }} /></Field>
            </div>
          </SectionCard>
          <StatementForm state={{ ...state.purchase, matterType: 'purchase' }} onChange={setPurchase} completionDate={state.completionDate} />
        </div>

        <div style={{ position: 'sticky', top: 96, display: 'grid', gap: 16, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <LedgerPreview computed={computed.sale} statement={salePreview} title="Sale Completion Statement" />
          <LedgerPreview computed={computed.purchase} statement={purchasePreview} title="Purchase Completion Statement" />
        </div>
      </main>
    </div>
  );
}

function SideHeading({ icon: Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: colors.burgundy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="white" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, margin: 0 }}>{title}</h2>
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
