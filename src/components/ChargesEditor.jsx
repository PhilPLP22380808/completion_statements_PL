import React from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { colors, inputStyle, labelStyle } from '../theme';
import { MoneyInput, DateInput, AddButton, Field } from './fields';
import { calculateApportionment } from '../lib/calc';
import { chargeBalanceValue, newCharge } from '../lib/statement';
import { APPORTIONMENT_CATEGORIES } from '../lib/catalog';
import { formatCurrency, formatShortDate } from '../lib/format';

const readonlyBox = {
  ...inputStyle, background: '#f5f5f5', border: '1px solid #ddd', color: '#555', fontWeight: 500, textAlign: 'right',
};

export default function ChargesEditor({ charges, completionDate, onChange }) {
  const update = (id, patch) => onChange(charges.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => onChange(charges.length > 1 ? charges.filter((c) => c.id !== id) : charges);
  const add = () => onChange([...charges, newCharge({ name: 'New Charge', category: 'Service Charge' })]);

  return (
    <div>
      <div style={{ display: 'grid', gap: 14 }}>
        {charges.map((charge) => {
          const calc = calculateApportionment(
            { ...charge, accountBalance: charge.accountBalance === '' ? '' : chargeBalanceValue(charge) },
            completionDate
          );
          return (
            <div key={charge.id} style={{ border: `1px solid ${colors.line}`, borderRadius: 12, overflow: 'hidden' }}>
              <div
                onClick={() => update(charge.id, { expanded: !charge.expanded })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: colors.panel, cursor: 'pointer', userSelect: 'none' }}
              >
                <input
                  type="text"
                  value={charge.name}
                  onChange={(e) => update(charge.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Charge name"
                  style={{ ...inputStyle, width: 200, fontWeight: 600, background: 'white' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {calc.complete && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: calc.action === 'add' ? colors.positive : colors.negative }}>
                      {calc.action === 'add' ? '+' : '−'}{formatCurrency(calc.amountToApportion)} to {calc.paidTo}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(charge.id); }}
                    disabled={charges.length === 1}
                    style={{ padding: 6, background: 'transparent', border: 'none', cursor: charges.length === 1 ? 'not-allowed' : 'pointer', opacity: charges.length === 1 ? 0.3 : 1, color: '#999' }}
                  >
                    <Trash2 size={16} />
                  </button>
                  {charge.expanded ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
                </div>
              </div>

              {charge.expanded && (
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <Field label="Category">
                      <select value={charge.category} onChange={(e) => update(charge.id, { category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {APPORTIONMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Account balance is">
                      <select value={charge.balanceType} onChange={(e) => update(charge.id, { balanceType: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="arrears">In arrears (account owes)</option>
                        <option value="credit">In credit</option>
                      </select>
                    </Field>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <Field label="Billing period start"><DateInput value={charge.periodStart} onChange={(e) => update(charge.id, { periodStart: e.target.value })} /></Field>
                    <Field label="Billing period end"><DateInput value={charge.periodEnd} onChange={(e) => update(charge.id, { periodEnd: e.target.value })} /></Field>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <Field label="Total charge for period (£)"><MoneyInput value={charge.totalCharge} onChange={(v) => update(charge.id, { totalCharge: v })} /></Field>
                    <Field label={`Balance on the managing agent's statement (£), ${charge.balanceType === 'credit' ? 'in credit' : 'in arrears'}`}>
                      <MoneyInput value={charge.accountBalance} onChange={(v) => update(charge.id, { accountBalance: v })} />
                    </Field>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 13 }}>
                    <Field label="Days in period"><div style={readonlyBox}>{calc.daysInPeriod ?? '-'}</div></Field>
                    <Field label="Daily rate (£)"><div style={readonlyBox}>{calc.dailyRate !== null ? calc.dailyRate.toFixed(4) : '-'}</div></Field>
                    <Field label="Days to apportion"><div style={readonlyBox}>{calc.daysToApportion ?? '-'}</div></Field>
                    <Field label="Buyer's share (£)"><div style={readonlyBox}>{calc.buyerShare !== null ? formatCurrency(calc.buyerShare) : '-'}</div></Field>
                  </div>

                  {calc.complete && (
                    <div style={{ marginTop: 12, background: colors.panel, borderRadius: 8, padding: 12, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#555' }}>
                        {charge.periodStart && charge.periodEnd && `Period ${formatShortDate(charge.periodStart)} to ${formatShortDate(charge.periodEnd)}. `}
                        Apportionment payable to <strong>{calc.paidTo}</strong>
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: calc.action === 'add' ? colors.positive : colors.negative }}>
                        {formatCurrency(calc.amountToApportion)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14 }}><AddButton onClick={add}>Add charge</AddButton></div>
    </div>
  );
}
