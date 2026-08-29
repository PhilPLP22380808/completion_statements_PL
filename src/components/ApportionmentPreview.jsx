import React from 'react';
import { colors } from '../theme';
import { formatAmount, formatCurrency, formatShortDate, parseMoney, round2 } from '../lib/format';
import { calculateApportionment } from '../lib/calc';

// Live preview of the apportionment statement (apportionment-only mode).
export default function ApportionmentPreview({ address, completionDate, purchasePrice, allowances, apportionments }) {
  const rows = apportionments.map((a) => ({
    charge: a,
    calc: calculateApportionment(
      { periodStart: a.periodStart, periodEnd: a.periodEnd, totalCharge: a.totalCharge, accountBalance: a.balanceOwed },
      completionDate
    ),
  }));
  const completed = rows.filter((r) => r.calc.complete);

  const price = parseMoney(purchasePrice);
  const ledger = [];
  if (price > 0) ledger.push({ label: 'Purchase price', value: price });
  allowances.forEach((al) => {
    const amt = parseMoney(al.amount);
    if (!amt) return;
    ledger.push({
      label: al.description || `Allowance in favour of ${al.inFavourOf}`,
      value: al.inFavourOf === 'buyer' ? -amt : amt,
    });
  });
  completed.forEach(({ charge, calc }) => {
    ledger.push({
      label: `${charge.name || 'Charge'} apportionment (to ${calc.paidTo})`,
      value: calc.action === 'add' ? calc.amountToApportion : -calc.amountToApportion,
    });
  });
  const total = round2(ledger.reduce((t, l) => round2(t + l.value), 0));
  const hasBalance = price > 0;

  return (
    <div style={{ background: 'white', border: `1px solid ${colors.line}`, borderRadius: 12, padding: '20px 22px', fontSize: 13 }}>
      <strong style={{ fontSize: 15, color: colors.ink }}>Apportionment Statement</strong>
      <div style={{ color: colors.muted, marginTop: 2, marginBottom: 14 }}>
        {address || 'Property address'}
        {completionDate ? `. Completion ${formatShortDate(completionDate)}` : ''}
      </div>

      {completed.length === 0 && (
        <div style={{ color: colors.faint, fontStyle: 'italic' }}>
          Enter a billing period, total charge and account balance for a charge to see the apportionment.
        </div>
      )}

      {completed.map(({ charge, calc }, i) => (
        <div key={i} style={{ border: `1px solid ${colors.line}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <div style={{ fontWeight: 600, color: colors.ink, marginBottom: 6 }}>{charge.name || 'Charge'}</div>
          <Row k="Billing period" v={`${formatShortDate(charge.periodStart)} to ${formatShortDate(charge.periodEnd)} (${calc.daysInPeriod} days)`} />
          <Row k="Total charge for period" v={formatCurrency(parseMoney(charge.totalCharge))} />
          <Row k="Daily rate" v={formatCurrency(calc.dailyRate)} />
          <Row k="Balance on account" v={formatCurrency(parseMoney(charge.balanceOwed))} />
          <Row k="Days to apportion" v={String(calc.daysToApportion)} />
          <Row k="Buyer's share" v={formatCurrency(calc.buyerShare)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: `1px solid ${colors.line}` }}>
            <span style={{ fontWeight: 600 }}>Payable to {calc.paidTo}</span>
            <span style={{ fontWeight: 700, color: calc.action === 'add' ? colors.positive : colors.negative }}>
              {formatCurrency(calc.amountToApportion)}
            </span>
          </div>
        </div>
      ))}

      {ledger.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontWeight: 600, color: colors.burgundy, marginBottom: 4 }}>Balance to complete</div>
          {ledger.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>{l.label}</span>
              <span style={{ color: l.value < 0 ? colors.negative : colors.ink }}>
                {l.value < 0 ? `(${formatAmount(-l.value)})` : formatAmount(l.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasBalance && (
        <div style={{ marginTop: 12, background: colors.burgundy, color: 'white', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance to complete</span>
          <strong style={{ fontSize: 20 }}>{formatCurrency(total)}</strong>
        </div>
      )}
      <div style={{ fontSize: 11, color: colors.faint, marginTop: 8 }}>Errors and Omissions Excepted</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', color: colors.muted }}>
      <span>{k}</span>
      <span style={{ color: colors.ink }}>{v}</span>
    </div>
  );
}
