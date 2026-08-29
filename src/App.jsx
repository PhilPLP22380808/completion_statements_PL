import React, { useState } from 'react';
import Wizard from './modes/Wizard';
import ApportionmentOnly from './modes/ApportionmentOnly';
import ComingSoon from './modes/ComingSoon';

export default function App() {
  const [mode, setMode] = useState('home');
  const goHome = () => setMode('home');

  switch (mode) {
    case 'apportionment':
      return <ApportionmentOnly onHome={goHome} />;
    case 'purchase':
      return <ComingSoon title="Purchase completion statement" onHome={goHome} />;
    case 'sale':
      return <ComingSoon title="Sale completion statement" onHome={goHome} />;
    case 'linked':
      return <ComingSoon title="Linked sale & purchase" onHome={goHome} />;
    default:
      return <Wizard onPick={setMode} />;
  }
}
