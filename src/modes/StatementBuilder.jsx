import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, FileDown, Building2, PoundSterling, Receipt, Wallet, CalendarDays, Scale,
} from 'lucide-react';
import { colors, inputStyle, labelStyle } from '../theme';
import {
  TextInput, DateInput, MoneyInput, Checkbox, DeleteButton, AddButton, QuickAdd, Field, SectionCard,
} from '../components/fields';
import ChargesEditor from '../components/ChargesEditor';
import LedgerPreview from '../components/LedgerPreview';
import { newStatement, newLine, computeStatement } from '../lib/statement';
import {
  purchasePriceAdditions, purchaseCosts, purchaseFunds, saleCosts, saleReceipts,
} from '../lib/catalog';

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
  const costCatalog = isPurchase ? purchaseCosts : saleCosts;
  const fundsCatalog = isPurchase ? purchaseFunds : saleReceipts;

  const editList = (key) => ({
    add: (item) => set({ [key]: [...state[key], newLine(item)] }),
    update: (id, patch) => set({ [key]: state[key].map((l) => (l.id === id ? { ...l, ...patch } : l)) }),
    remove: (id) => set({ [key]: state[key].filter((l) => l.id !== id) }),
  });
  const costs = editList('costs');
  const funds = editList('funds');
  const additions = editList('priceAdditions');

  const addAllowance = () => set({ allowances: [...state.allowances, { id: newLine().id, description: '', amount: '', inFavourOf: 'buyer' }] });
  const updAllowance = (id, patch) => set({ allowances: state.allowances.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const rmAllowance = (id) => set({ allowances: state.allowances.filter((a) => a.id !== id) });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${colors.burgundy} 0%, ${colors.rose} 100%)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20 }}>P</div>
            <div>
              <div style={{ fontWeight: 600, color: colors.burgundy, fontSize: 16 }}>Pinnacle Property Lawyers</div>
              <div style={{ fontSize: 12, color: '#888' }}>{isPurchase ? 'Purchase' : 'Sale'} Completion Statement</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onHome} style={btnGhost}><ArrowLeft size={16} /> Change task</button>
            <button onClick={resetAll} style={btnGhost}>Clear</button>
            <button onClick={() => alert('PDF export is being built next.')} style={btnPrimary}><FileDown size={18} /> Export</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 28, alignItems: 'start' }}>
        <div>
          {/* Matter details */}
          <SectionCard icon={Building2} title="Matter details">
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Client(s)"><TextInput value={state.clients} onChange={(e) => set({ clients: e.target.value })} placeholder="e.g. Jane Smith and John Smith" style={{ textAlign: 'left' }} /></Field>
              <Field label="Property address"><TextInput value={state.address} onChange={(e) => set({ address: e.target.value })} placeholder="Full property address" style={{ textAlign: 'left' }} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Our ref"><TextInput value={state.ourRef} onChange={(e) => set({ ourRef: e.target.value })} placeholder="AB/P/Smith-J" style={{ textAlign: 'left' }} /></Field>
                <Field label="Completion date (actual)"><DateInput value={state.completionDate} onChange={(e) => set({ completionDate: e.target.value })} /></Field>
                <Field label="Status">
                  <select value={state.status} onChange={(e) => set({ status: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option>Draft</option><option>Provisional</option><option>Final</option>
                  </select>
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* Price */}
          <SectionCard icon={PoundSterling} title={isPurchase ? 'Purchase price' : 'Sale price'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label={isPurchase ? 'Basic purchase price (£)' : 'Basic sale price (£)'}><MoneyInput value={state.price} onChange={(v) => set({ price: v })} /></Field>
              <Field label="Contents / fixtures price (£)"><MoneyInput value={state.contentsPrice} onChange={(v) => set({ contentsPrice: v })} /></Field>
            </div>

            {isPurchase && (
              <div style={{ marginTop: 18 }}>
                <div style={{ ...labelStyle, marginBottom: 8 }}>Additions to the price (SDLT, Land Registry fee, notice fees…)</div>
                <LineList
                  lines={state.priceAdditions}
                  onUpdate={additions.update}
                  onRemove={additions.remove}
                  showVat={false}
                />
                <div style={{ marginTop: 10 }}>
                  <QuickAdd catalog={purchasePriceAdditions} existingLabels={state.priceAdditions.map((l) => l.label)} onAdd={additions.add} placeholder="Add an addition…" />
                </div>
              </div>
            )}
          </SectionCard>

          {/* Costs */}
          <SectionCard icon={Receipt} title="Costs & disbursements">
            <LineList lines={state.costs} onUpdate={costs.update} onRemove={costs.remove} showVat />
            <div style={{ marginTop: 10 }}>
              <QuickAdd catalog={costCatalog} existingLabels={state.costs.map((l) => l.label)} onAdd={costs.add} placeholder="Add a cost or disbursement…" />
            </div>
          </SectionCard>

          {/* Funds / receipts */}
          <SectionCard icon={Wallet} title={isPurchase ? 'Funds received' : 'Receipts'}>
            <LineList lines={state.funds} onUpdate={funds.update} onRemove={funds.remove} showVat={false} />
            <div style={{ marginTop: 10 }}>
              <QuickAdd catalog={fundsCatalog} existingLabels={state.funds.map((l) => l.label)} onAdd={funds.add} placeholder="Add a receipt…" />
            </div>
          </SectionCard>

          {/* Allowances */}
          <SectionCard icon={Scale} title="Allowances & adjustments" action={<AddButton onClick={addAllowance}>Add</AddButton>}>
            {state.allowances.length === 0 && <div style={{ color: colors.faint, fontSize: 13, fontStyle: 'italic' }}>None. Add credits, retentions, indemnity contributions, etc.</div>}
            <div style={{ display: 'grid', gap: 10 }}>
              {state.allowances.map((a) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr auto', gap: 10, alignItems: 'end', padding: 12, background: colors.panel, borderRadius: 10 }}>
                  <Field label="Description"><TextInput value={a.description} onChange={(e) => updAllowance(a.id, { description: e.target.value })} placeholder="e.g. Service charge credit" style={{ textAlign: 'left' }} /></Field>
                  <Field label="Amount (£)"><MoneyInput value={a.amount} onChange={(v) => updAllowance(a.id, { amount: v })} /></Field>
                  <Field label="In favour of">
                    <select value={a.inFavourOf} onChange={(e) => updAllowance(a.id, { inFavourOf: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </Field>
                  <DeleteButton onClick={() => rmAllowance(a.id)} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Apportionments */}
          <SectionCard icon={CalendarDays} title="Charges to apportion"
            action={<Checkbox checked={state.includeApportionments} onChange={(v) => set({ includeApportionments: v })} label="Include apportionments" />}>
            {state.includeApportionments ? (
              <>
                {!state.completionDate && <Note>Set the completion date above to calculate apportionments.</Note>}
                <ChargesEditor charges={state.charges} completionDate={state.completionDate} onChange={(charges) => set({ charges })} />
                <Note>A separate apportionment statement will be produced alongside the completion statement.</Note>
              </>
            ) : (
              <div style={{ color: colors.faint, fontSize: 13, fontStyle: 'italic' }}>
                Tick “Include apportionments” if there are service charge, ground rent or other periodic charges to split with the other side.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Live preview */}
        <div style={{ position: 'sticky', top: 96 }}>
          <LedgerPreview computed={computed} statement={state} />
        </div>
      </main>
    </div>
  );
}

function LineList({ lines, onUpdate, onRemove, showVat }) {
  if (lines.length === 0) return null;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {lines.map((l) => (
        <div key={l.id} style={{ display: 'grid', gridTemplateColumns: showVat ? '1fr 150px 90px auto' : '1fr 150px auto', gap: 10, alignItems: 'center', padding: '8px 12px', background: colors.panel, borderRadius: 10 }}>
          <TextInput value={l.label} onChange={(e) => onUpdate(l.id, { label: e.target.value })} placeholder="Description" style={{ textAlign: 'left', background: 'white' }} />
          <MoneyInput value={l.amount} onChange={(v) => onUpdate(l.id, { amount: v })} style={{ background: 'white' }} />
          {showVat && <Checkbox checked={l.vatable} onChange={(v) => onUpdate(l.id, { vatable: v })} label="+VAT" />}
          <DeleteButton onClick={() => onRemove(l.id)} />
        </div>
      ))}
    </div>
  );
}

function Note({ children }) {
  return <div style={{ marginTop: 12, fontSize: 12.5, color: colors.muted, background: colors.panel, borderRadius: 8, padding: '8px 12px' }}>{children}</div>;
}

const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'white',
  color: colors.burgundy, border: `1px solid ${colors.blush}`, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: colors.burgundy,
  color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
