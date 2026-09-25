import React, { useState } from 'react';
import { Calculator, ArrowLeftRight, FileText, History } from 'lucide-react';
import { colors } from '../theme';
import Brand from '../components/Brand';
import { MoneyIntoHouse, MoneyOutOfHouse } from '../components/HomeIcons';

const options = [
  { id: 'apportionment', icon: Calculator, title: 'Apportionment statement only' },
  { id: 'purchase', icon: MoneyIntoHouse, title: 'Purchase completion statement' },
  { id: 'sale', icon: MoneyOutOfHouse, title: 'Sale completion statement' },
  { id: 'linked', icon: ArrowLeftRight, title: 'Linked sale and purchase' },
  { id: 'history', icon: History, title: 'History' },
];

export default function Wizard({ onContinue, onNew }) {
  const [pending, setPending] = useState(null);
  const onPick = (id) => (id === 'history' ? onContinue(id) : setPending(id));
  const pendingTitle = options.find((o) => o.id === pending)?.title;

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
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Brand label="Completion Statement Builder" />
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
          {options.map(({ id, icon: Icon, title }) => (
            <button
              key={id}
              onClick={() => onPick(id)}
              style={{
                display: 'flex', gap: 16, alignItems: 'center', textAlign: 'left',
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
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink }}>{title}</div>
            </button>
          ))}
        </div>
      </main>

      {pending && (
        <div
          onClick={() => setPending(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,22,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 200 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 14, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: 20, color: colors.ink }}>{pendingTitle}</h2>
            <p style={{ margin: '0 0 22px', color: colors.muted, fontSize: 15 }}>
              Start a new matter, or carry on with the one you were last working on?
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={() => { const id = pending; setPending(null); onNew(id); }} style={{ padding: '12px 16px', background: colors.burgundy, color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                New matter
              </button>
              <button onClick={() => { const id = pending; setPending(null); onContinue(id); }} style={{ padding: '12px 16px', background: 'white', color: colors.burgundy, border: `1px solid ${colors.blush}`, borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Continue existing matter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
