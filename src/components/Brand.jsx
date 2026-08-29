import React from 'react';
import { colors, firm } from '../theme';
import { pinnacleMarkPng } from '../assets/logo';

// App header lockup: the Pinnacle mark, the trading name, and a context label.
export default function Brand({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src={pinnacleMarkPng} alt="Pinnacle Law" style={{ width: 38, height: 38, borderRadius: 8, display: 'block' }} />
      <div>
        <div style={{ fontWeight: 600, color: colors.burgundy, fontSize: 16 }}>{firm.name}</div>
        {label && <div style={{ fontSize: 12, color: '#888' }}>{label}</div>}
      </div>
    </div>
  );
}
