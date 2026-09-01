import React from 'react';
import { PoundSterling, Receipt, Wallet, CalendarDays, Scale, Building2, AlertTriangle } from 'lucide-react';
import { colors, inputStyle } from '../theme';
import { TextInput, MoneyInput, Checkbox, DeleteButton, AddButton, Field, SectionCard, Datalist } from './fields';
import ChargesEditor from './ChargesEditor';
import { newLine, effectiveNet } from '../lib/statement';
import { purchaseCostItems, purchaseFunds, saleCostItems, saleReceipts, ALLOWANCE_DESCRIPTIONS, SDLT_RATE_OPTIONS } from '../lib/catalog';
import { formatCurrency } from '../lib/format';

const isSdlt = (label) => /stamp duty land tax|^sdlt/i.test(label || '');
const isEstateAgent = (label) => /estate agent/i.test(label || '');
const looksLikeContents = (label) => /content|fixture|fitting|chattel/i.test(label || '');

// All the money sections for one statement. `state` is a statement object,
// `onChange(patch)` merges a partial update. `completionDate` is passed in so a
// linked deal can share one date across both sides.
//
// Every list section works the same way: an "Add" button in the header adds an
// empty row; each row has a free-text description, an amount, an optional +VAT
// toggle, and a delete button. Some rows show an extra control below (the SDLT
// rate, the estate agent percentage) or a warning.
export default function StatementForm({ state, onChange, completionDate }) {
  const isPurchase = state.matterType === 'purchase';
  const costsCatalog = isPurchase ? purchaseCostItems : saleCostItems;
  const fundsCatalog = isPurchase ? purchaseFunds : saleReceipts;
  const set = onChange;
  const salePrice = isPurchase ? '' : state.price;

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

  // Extra control (or warning) shown below a Costs row.
  const costsRowExtra = (l) => {
    if (isPurchase && isSdlt(l.label)) {
      return (
        <ExtraField label="SDLT rate / relief">
          <select
            value={l.sdltBasis || ''}
            onChange={(e) => otherCosts.update(l.id, { sdltBasis: e.target.value })}
            style={{ ...inputStyle, cursor: 'pointer', maxWidth: 360 }}
          >
            <option value="">Select the rate that applies...</option>
            {SDLT_RATE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </ExtraField>
      );
    }
    if (!isPurchase && isEstateAgent(l.label)) {
      const pct = l.pct || '';
      const computed = effectiveNet(l, salePrice);
      return (
        <ExtraField label="Or a percentage of the sale price">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <MoneyInput value={pct} onChange={(v) => otherCosts.update(l.id, { pct: v })} placeholder="0.00" style={{ width: 90, background: 'white' }} allowNegative={false} />
            <span style={{ fontSize: 13, color: colors.muted }}>
              % of sale price
              {parseFloat(pct) > 0 && (parseFloat(salePrice) > 0
                ? `  =  ${formatCurrency(computed)} net`
                : '  (enter the sale price above)')}
            </span>
          </div>
        </ExtraField>
      );
    }
    if (looksLikeContents(l.label)) return <DupWarning />;
    return null;
  };

  const receiptsRowExtra = (l) => (looksLikeContents(l.label) ? <DupWarning /> : null);

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
        lines={state.costs || []}
        list={costs}
        showVat
        emptyHint="Our legal fee and any disbursements. Add a line and type it in."
        note="Enter fees net of VAT. Tick +VAT to add 20%."
        salePrice={salePrice}
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
        rowExtra={costsRowExtra}
        salePrice={salePrice}
      />

      <ItemSection
        icon={Wallet}
        title="Receipts"
        listId="receipts-list"
        lines={state.funds || []}
        list={funds}
        catalog={fundsCatalog}
        emptyHint="Deposit, mortgage advance, payment on account, test payment, funds from a linked sale."
        rowExtra={receiptsRowExtra}
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
// (+VAT) / delete rows, each optionally followed by an extra control or warning.
function ItemSection({ icon, title, listId, lines, list, catalog = [], showVat = false, emptyHint, note, rowExtra, salePrice }) {
  const options = catalog.map((c) => c.label);
  const hasSuggestions = options.length > 0;
  const cols = showVat ? '2fr 1fr auto auto' : '2fr 1fr auto';

  const onLabelChange = (id, label) => {
    const match = catalog.find((c) => c.label === label);
    list.update(id, match ? { label, vatable: !!match.vatable } : { label });
  };

  return (
    <SectionCard icon={icon} title={title} action={<AddButton onClick={() => list.add(showVat ? { vatable: false } : {})}>Add</AddButton>}>
      {lines.length === 0 && <div style={hintStyle}>{emptyHint}</div>}
      {note && lines.length > 0 && <div style={{ ...hintStyle, marginBottom: 10 }}>{note}</div>}
      {hasSuggestions && <Datalist id={listId} options={options} />}
      <div style={{ display: 'grid', gap: 10 }}>
        {lines.map((l) => {
          const pctDriven = isEstateAgent(l.label) && parseFloat(l.pct) > 0;
          const amountValue = pctDriven ? String(effectiveNet(l, salePrice)) : l.amount;
          const extra = rowExtra && rowExtra(l);
          return (
            <div key={l.id} style={rowStyle(cols)}>
              <Field label="Description">
                <TextInput list={hasSuggestions ? listId : undefined} value={l.label} onChange={(e) => onLabelChange(l.id, e.target.value)} placeholder="Description" style={{ textAlign: 'left', background: 'white' }} />
              </Field>
              <Field label={showVat ? 'Net amount (£)' : 'Amount (£)'}>
                <MoneyInput value={amountValue} onChange={(v) => list.update(l.id, { amount: v })} disabled={pctDriven} style={{ background: pctDriven ? colors.panel : 'white' }} />
              </Field>
              {showVat && (
                <div style={{ paddingBottom: 9 }}>
                  <Checkbox checked={l.vatable} onChange={(v) => list.update(l.id, { vatable: v })} label="+VAT" />
                </div>
              )}
              <DeleteButton onClick={() => list.remove(l.id)} />
              {extra && <div style={{ gridColumn: '1 / -1' }}>{extra}</div>}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ExtraField({ label, children }) {
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${colors.line}` }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: colors.faint, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function DupWarning() {
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: colors.negative }}>
      <AlertTriangle size={15} />
      There is a Contents / fixtures price field in the Price section above. Are you sure you want this as a separate line too?
    </div>
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
