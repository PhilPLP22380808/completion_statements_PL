import React from 'react';
import { PoundSterling, Receipt, Wallet, CalendarDays, Scale, Building2 } from 'lucide-react';
import { colors, inputStyle } from '../theme';
import { TextInput, MoneyInput, Checkbox, DeleteButton, AddButton, QuickAdd, Field, SectionCard, AllowanceDatalist, ALLOWANCE_LIST_ID } from './fields';
import ChargesEditor from './ChargesEditor';
import { newLine } from '../lib/statement';
import { purchaseFees, purchaseCostItems, purchaseFunds, saleFees, saleCostItems, saleReceipts, ALLOWANCE_DESCRIPTIONS } from '../lib/catalog';

// All the money sections for one statement. `state` is a statement object,
// `onChange(patch)` merges a partial update. `completionDate` is passed in so a
// linked deal can share one date across both sides.
export default function StatementForm({ state, onChange, completionDate }) {
  const isPurchase = state.matterType === 'purchase';
  const feesCatalog = isPurchase ? purchaseFees : saleFees;
  const costsCatalog = isPurchase ? purchaseCostItems : saleCostItems;
  const fundsCatalog = isPurchase ? purchaseFunds : saleReceipts;
  const set = onChange;

  const editList = (key) => ({
    add: (item) => set({ [key]: [...(state[key] || []), newLine(item)] }),
    update: (id, patch) => set({ [key]: state[key].map((l) => (l.id === id ? { ...l, ...patch } : l)) }),
    remove: (id) => set({ [key]: state[key].filter((l) => l.id !== id) }),
  });
  const costs = editList('costs');
  const otherCosts = editList('otherCosts');
  const funds = editList('funds');

  const addAllowance = () => set({ allowances: [...state.allowances, { id: newLine().id, description: '', amount: '', inFavourOf: 'buyer' }] });
  const updAllowance = (id, patch) => set({ allowances: state.allowances.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const rmAllowance = (id) => set({ allowances: state.allowances.filter((a) => a.id !== id) });

  const costsHint = isPurchase
    ? 'SDLT, Land Registry fee, notice fees, indemnity premiums, and anything else leaving the completion account.'
    : 'Mortgage redemption, estate agent commission, landlord fees, and anything else leaving the completion account.';

  return (
    <>
      <SectionCard icon={PoundSterling} title={isPurchase ? 'Purchase price' : 'Sale price'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label={isPurchase ? 'Basic purchase price (£)' : 'Basic sale price (£)'}><MoneyInput value={state.price} onChange={(v) => set({ price: v })} /></Field>
          <Field label="Contents / fixtures price (£)"><MoneyInput value={state.contentsPrice} onChange={(v) => set({ contentsPrice: v })} /></Field>
        </div>
      </SectionCard>

      <SectionCard icon={Receipt} title="Fees and disbursements">
        <LineList lines={state.costs} onUpdate={costs.update} onRemove={costs.remove} showVat />
        <div style={{ marginTop: 10 }}>
          <QuickAdd catalog={feesCatalog} existingLabels={state.costs.map((l) => l.label)} onAdd={costs.add} placeholder="Add a fee or disbursement..." />
        </div>
      </SectionCard>

      <SectionCard icon={Building2} title="Costs">
        {(state.otherCosts || []).length === 0 && <div style={{ color: colors.faint, fontSize: 13, fontStyle: 'italic' }}>{costsHint}</div>}
        <LineList lines={state.otherCosts || []} onUpdate={otherCosts.update} onRemove={otherCosts.remove} showVat />
        <div style={{ marginTop: 10 }}>
          <QuickAdd catalog={costsCatalog} existingLabels={(state.otherCosts || []).map((l) => l.label)} onAdd={otherCosts.add} placeholder="Add a cost..." />
        </div>
      </SectionCard>

      <SectionCard icon={Wallet} title="Receipts">
        <LineList lines={state.funds} onUpdate={funds.update} onRemove={funds.remove} showVat={false} />
        <div style={{ marginTop: 10 }}>
          <QuickAdd catalog={fundsCatalog} existingLabels={state.funds.map((l) => l.label)} onAdd={funds.add} placeholder="Add a receipt..." />
        </div>
      </SectionCard>

      <SectionCard icon={Scale} title="Allowances & adjustments" action={<AddButton onClick={addAllowance}>Add</AddButton>}>
        {state.allowances.length === 0 && <div style={{ color: colors.faint, fontSize: 13, fontStyle: 'italic' }}>None. Add credits, retentions, indemnity contributions, etc.</div>}
        <AllowanceDatalist options={ALLOWANCE_DESCRIPTIONS} />
        <div style={{ display: 'grid', gap: 10 }}>
          {state.allowances.map((a) => (
            <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr auto', gap: 10, alignItems: 'end', padding: 12, background: colors.panel, borderRadius: 10 }}>
              <Field label="Description"><TextInput list={ALLOWANCE_LIST_ID} value={a.description} onChange={(e) => updAllowance(a.id, { description: e.target.value })} placeholder="e.g. Service charge credit" style={{ textAlign: 'left' }} /></Field>
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

      <SectionCard icon={CalendarDays} title="Charges to apportion"
        action={<Checkbox checked={state.includeApportionments} onChange={(v) => set({ includeApportionments: v })} label="Include apportionments" />}>
        {state.includeApportionments ? (
          <>
            {!completionDate && <Note>Set the completion date to calculate apportionments.</Note>}
            <ChargesEditor charges={state.charges} completionDate={completionDate} onChange={(charges) => set({ charges })} />
            <Note>A separate apportionment statement is produced alongside the completion statement.</Note>
          </>
        ) : (
          <div style={{ color: colors.faint, fontSize: 13, fontStyle: 'italic' }}>
            Tick "Include apportionments" if there are service charge, ground rent or other periodic charges to split with the other side.
          </div>
        )}
      </SectionCard>
    </>
  );
}

export function LineList({ lines, onUpdate, onRemove, showVat }) {
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

export function Note({ children }) {
  return <div style={{ marginTop: 12, fontSize: 12.5, color: colors.muted, background: colors.panel, borderRadius: 8, padding: '8px 12px' }}>{children}</div>;
}
