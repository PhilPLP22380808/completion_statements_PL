import React from 'react';

// Bespoke icons for the start screen: money looping into a house (purchase)
// and money looping out of a house (sale). Lucide style: 24x24, stroked,
// round caps and joins.

const base = {
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const poundStyle = { fontWeight: 700, fontFamily: "Georgia, 'Times New Roman', serif" };

export function MoneyIntoHouse({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      {/* house on the right */}
      <path d="M13 21v-6l3.5-3 3.5 3v6z" />
      <path d="M15.2 21v-3h2.6v3" />
      {/* pound sign on the left */}
      <text x="0.5" y="20" fontSize="12" fill={color} stroke="none" style={poundStyle}>£</text>
      {/* looping arrow up from the pound and down into the house */}
      <path d="M5 13.5C4.2 6 12 3.2 16 10.5" />
      <path d="m12.7 10 3.6 1 1.1-3.5" />
    </svg>
  );
}

export function MoneyOutOfHouse({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      {/* house on the left */}
      <path d="M4 21v-6l3.5-3 3.5 3v6z" />
      <path d="M6.2 21v-3h2.6v3" />
      {/* pound sign on the right */}
      <text x="17.5" y="20" fontSize="12" fill={color} stroke="none" style={poundStyle}>£</text>
      {/* looping arrow up from the house and out to the pound */}
      <path d="M8 10.5C12 3.2 19.8 6 19 13.5" />
      <path d="m15.6 12.5 3.6-1 1.1 3.5" />
    </svg>
  );
}
