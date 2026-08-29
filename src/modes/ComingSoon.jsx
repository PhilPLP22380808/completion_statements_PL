import React from 'react';
import { ArrowLeft, Hammer } from 'lucide-react';
import { colors } from '../theme';

export default function ComingSoon({ title, onHome }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #faf8f8 0%, #f5f0f1 100%)',
      fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40, maxWidth: 460, textAlign: 'center',
        boxShadow: '0 4px 20px rgba(114,47,55,0.12)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: colors.panel,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
        }}>
          <Hammer size={26} color={colors.burgundy} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: colors.ink }}>{title}</h2>
        <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
          We're building this next. The apportionment calculator is ready to use now.
        </p>
        <button
          onClick={onHome}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', background: colors.burgundy, color: 'white',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Back to start
        </button>
      </div>
    </div>
  );
}
