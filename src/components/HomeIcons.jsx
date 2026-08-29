import React from 'react';
import { PoundSterling, Home, ArrowRight, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

// Start-screen icons for purchase and sale. Two options are kept here so the
// look can be compared; Wizard imports whichever pair we settle on.

// Option A: a small left-to-right lockup. Money into a house / house out to money.
export function MoneyIntoHouse({ size = 24, color = 'currentColor' }) {
  const g = Math.round(size * 0.62);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, color }}>
      <PoundSterling size={g} strokeWidth={2.25} />
      <ArrowRight size={Math.round(g * 0.72)} strokeWidth={2.5} />
      <Home size={g} strokeWidth={2.25} />
    </span>
  );
}

export function MoneyOutOfHouse({ size = 24, color = 'currentColor' }) {
  const g = Math.round(size * 0.62);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, color }}>
      <Home size={g} strokeWidth={2.25} />
      <ArrowRight size={Math.round(g * 0.72)} strokeWidth={2.5} />
      <PoundSterling size={g} strokeWidth={2.25} />
    </span>
  );
}

// Option B: one house glyph with a directional arrow. Simplest, most legible.
export function HouseArrowIn({ size = 24, color = 'currentColor' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color }}>
      <Home size={size} />
      <ArrowDownToLine size={Math.round(size * 0.62)} style={{ marginLeft: -3, marginTop: 5 }} />
    </span>
  );
}

export function HouseArrowOut({ size = 24, color = 'currentColor' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color }}>
      <Home size={size} />
      <ArrowUpFromLine size={Math.round(size * 0.62)} style={{ marginLeft: -3, marginTop: -5 }} />
    </span>
  );
}
