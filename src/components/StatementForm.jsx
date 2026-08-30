import React from 'react';
import { PoundSterling, Receipt, Wallet, CalendarDays, Scale, Building2 } from 'lucide-react';
import { colors, inputStyle } from '../theme';
import { TextInput, MoneyInput, Checkbox, DeleteButton, AddButton, Field, SectionCard, Datalist } from './fields';
import ChargesEditor from './ChargesEditor';
import { newLine } from '../lib/statement';
import { purchaseCostItems, purchaseFunds, saleCostItems, saleReceipts, ALLOWANCE_DESCRIPTIONS } from '../lib/catalog';

// All the money sections for one statement. `state` is a statement object,
// `onChange(patch)` merges a partial update. `completionDate` is passed in so a
// linked deal can share one date across both sides.
//
// Every list section works the same way: an "Add" button in the header adds an
// empty row; each row has a free-text description (with a suggestions list),
// an amount, an optional +VAT toggle, and a delete button.
export default function StatementForm({ state, onChange, completionDate }) {
  const isPurchase = state.matterType === 'purchase';
  const costsCatalog = isPurchase ? purchaseCostItems : saleCostItems;
  const fundsCatalog = isPurchase ? purchaseFunds : saleReceipts;
  const set = onChange;

  const editList = (key) => ({
    add: (item) => set({ [key]: [...(state[key] || []), newLine(item)] }),
    update: (id, patch) => set({ [key]: (state[key] || []).map((l) => (l.id === id ? { ...l, ...patch } : l)) }),
    remove: (id) => set({ [key]: (state[key] || []).filter((l) => l.id !== id) }),
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

      <ItemSection
        icon={Receipt}
        title="Fees and disbursements"
        listId="fees-list"
        lines={state.costs || []}
        list={costs}
        showVat
        defaultVat
        emptyHint="Our legal fee and any disbursements. Add a line and type it in."
      />

      <ItemSection
        icon={Building2}
        title="Costs"
        listId="costs-list"
        lines={state.otherCosts || []}
        list={otherCosts}
        catalog={costsCatalog}
        showVat
        emptyHint={costsHint}
      />

      <ItemSection
        icon={Wallet}
        title="Receipts"
        listId="receipts-list"
        lines={state.funds || []}
        list={funds}
        catalog={fundsCatalog}
        emptyHint="Deposit, mortgage advance, payment on account, funds from a linked sale."
      />

      <SectionCard icon={Scale} title="Allowances & adjustments" action={<AddButton onClick={addAllowance}>Add</AddButton>}>
        {state.allowances.length === 0 && <div style={hintStyle}>None. Add credits, indemnity contributions, contributions to costs, etc.</div>}
        <Datalist id="allowance-descriptions" options={ALLOWANCE_DESCRIPTIONS} />
        <div style={{ display: 'grid', gap: 10 }}>
          {state.allowances.map((a) => (
            <div key={a.id} style={rowStyle('2fr 1fr 1.4fr auto')}>
              <Field label="Description"><TextInput list="allowance-descriptions" value={a.description} onChange={(e) => updAllowance(a.id, { description: e.target.value })} placeholder="e.g. Service charge credit" style={{ textAlign: 'left', background: 'white' }} /></Field>
              <Field label="Amount (£)"><MoneyInput value={a.amount} onChange={(v) => updAllowance(a.id, { amount: v })} style={{ background: 'white' }} /></Field>
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
          <div style={hintStyle}>
            Tick "Include apportionments" if there are service charge, ground rent or other periodic charges to split with the other side.
          </div>
        )}
      </SectionCard>
    </>
  );
}

// One list section: header Add button, empty hint, and description / amount /
// (+VAT) / delete rows. When a catalog is given, picking a known label from the
// suggestions list applies that item's usual VAT treatment (still overridable);
// with no catalog the description is plain free text.
function ItemSection({ icon, title, listId, lines, list, catalog = [], showVat = false, defaultVat = false, emptyHint }) {
  const options = catalog.map((c) => c.label);
  const hasSuggestions = options.length > 0;
  const cols = showVat ? '2fr 1fr auto auto' : '2fr 1fr auto';

  const onLabelChange = (id, label) => {
    const match = catalog.find((c) => c.label === label);
    list.update(id, match ? { label, vatable: !!match.vatable } : { label });
  };

  return (
    <SectionCard icon={icon} title={title} action={<AddButton onClick={() => list.add(showVat ? { vatable: defaultVat } : {})}>Add</AddButton>}>
      {lines.length === 0 && <div style={hintStyle}>{emptyHint}</div>}
      {hasSuggestions && <Datalist id={listId} options={options} />}
      <div style={{ display: 'grid', gap: 10 }}>
        {lines.map((l) => (
          <div key={l.id} style={rowStyle(cols)}>
            <Field label="Description">
              <TextInput list={hasSuggestions ? listId : undefined} value={l.label} onChange={(e) => onLabelChange(l.id, e.target.value)} placeholder="Description" style={{ textAlign: 'left', background: 'white' }} />
            </Field>
            <Field label="Amount (£)">
              <MoneyInput value={l.amount} onChange={(v) => list.update(l.id, { amount: v })} style={{ background: 'white' }} />
            </Field>
            {showVat && (
              <div style={{ paddingBottom: 9 }}>
                <Checkbox checked={l.vatable} onChange={(v) => list.update(l.id, { vatable: v })} label="+VAT" />
              </div>
            )}
            <DeleteButton onClick={() => list.remove(l.id)} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const hintStyle = { color: colors.faint, fontSize: 13, fontStyle: 'italic' };
const rowStyle = (cols) => ({
  display: 'grid', gridTemplateColumns: cols, gap: 10, alignItems: 'end',
  padding: 12, background: colors.panel, borderRadius: 10,
});

export function Note({ children }) {
  return <div style={{ marginTop: 12, fontSize: 12.5, color: colors.muted, background: colors.panel, borderRadius: 8, padding: '8px 12px' }}>{children}</div>;
}
