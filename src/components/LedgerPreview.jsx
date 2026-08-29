import React from 'react';
import { colors } from '../theme';
import { formatAmount } from '../lib/format';

// On-screen preview of the completion statement ledger.
export default function LedgerPreview({ computed, statement }) {
  const { sections, absTotal, wording } = computed;

  return (
    <div style={{ background: 'white', border: `1px solid ${colors.line}`, borderRadius: 12, padding: '20px 22px', fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <strong style={{ fontSize: 15, color: colors.ink }}>Client Completion Statement</strong>
        <span style={{ fontSize: 12, color: colors.faint }}>{statement.status}</span>
      </div>
      <div style={{ color: colors.muted, marginBottom: 14 }}>
        {statement.clients || 'Client(s)'}{statement.address ? `, ${statement.address}` : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 4, fontWeight: 600, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px', paddingBottom: 6, borderBottom: `1px solid ${colors.line}` }}>
        <span />
        <span style={{ textAlign: 'right' }}>Payments £</span>
        <span style={{ textAlign: 'right' }}>Receipts £</span>
      </div>

      {sections.map((s) => (
        <div key={s.key}>
          <div style={{ fontWeight: 600, color: colors.burgundy, marginTop: 12, marginBottom: 4 }}>{s.title}</div>
          {s.lines.length === 0 && <div style={{ color: colors.faint, fontStyle: 'italic', padding: '2px 0' }}>None</div>}
          {s.lines.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 4, padding: '2px 0' }}>
              <span>{l.label}{l.vatable ? ' (incl. VAT)' : ''}</span>
              <span style={{ textAlign: 'right' }}>{l.payment ? formatAmount(l.payment) : ''}</span>
              <span style={{ textAlign: 'right' }}>{l.receipt ? formatAmount(l.receipt) : ''}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 4, padding: '4px 0', borderTop: `1px solid ${colors.line}`, marginTop: 4, fontWeight: 600 }}>
            <span>Subtotal: {s.title}</span>
            <span style={{ textAlign: 'right' }}>{formatAmount(s.subtotal)}</span>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 16, background: colors.burgundy, color: 'white', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{wording}</span>
        <strong style={{ fontSize: 20 }}>£{formatAmount(absTotal)}</strong>
      </div>
      <div style={{ fontSize: 11, color: colors.faint, marginTop: 8 }}>Errors and Omissions Excepted</div>
    </div>
  );
}
