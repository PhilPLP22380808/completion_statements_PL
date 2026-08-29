import React from 'react';
import { Calculator, Home, ShoppingCart, ArrowLeftRight, FileText } from 'lucide-react';
import { colors } from '../theme';

const options = [
  {
    id: 'apportionment',
    icon: Calculator,
    title: 'Apportionment statement only',
    blurb: 'Apportion service charge, ground rent or any periodic charge between seller and buyer. Produces a standalone apportionment statement.',
  },
  {
    id: 'purchase',
    icon: Home,
    title: 'Purchase completion statement',
    blurb: 'A client completion statement for a purchase — price, SDLT, disbursements, deposit and mortgage. Fold in apportionments if you need them.',
  },
  {
    id: 'sale',
    icon: ShoppingCart,
    title: 'Sale completion statement',
    blurb: 'A client completion statement for a sale — sale price, agent commission, mortgage redemption and any apportionments from the buyer.',
  },
  {
    id: 'linked',
    icon: ArrowLeftRight,
    title: 'Linked sale & purchase',
    blurb: 'Both statements together, with the net sale proceeds carried straight into the purchase. One set of client and completion details.',
  },
];

export default function Wizard({ onPick }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #faf8f8 0%, #f5f0f1 100%)',
      fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <header style={{
        background: 'white',
        borderBottom: `3px solid ${colors.burgundy}`,
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: `linear-gradient(135deg, ${colors.burgundy} 0%, ${colors.rose} 100%)`,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 20,
          }}>P</div>
          <div>
            <div style={{ fontWeight: 600, color: colors.burgundy, fontSize: 16 }}>Pinnacle Property Lawyers</div>
            <div style={{ fontSize: 12, color: '#888' }}>Completion Statement Builder</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <FileText size={22} color={colors.burgundy} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.ink, margin: 0 }}>What would you like to prepare?</h1>
        </div>
        <p style={{ color: colors.muted, fontSize: 15, marginBottom: 32 }}>
          Pick a starting point. You can add or leave out sections as you go.
        </p>

        <div style={{ display: 'grid', gap: 14 }}>
          {options.map(({ id, icon: Icon, title, blurb }) => (
            <button
              key={id}
              onClick={() => onPick(id)}
              style={{
                display: 'flex', gap: 16, alignItems: 'flex-start', textAlign: 'left',
                background: 'white', border: `1px solid ${colors.line}`, borderRadius: 14,
                padding: 20, cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = colors.rose;
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(114,47,55,0.12)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = colors.line;
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{
                flexShrink: 0, width: 44, height: 44, borderRadius: 10,
                background: colors.panel, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color={colors.burgundy} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.5 }}>{blurb}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
