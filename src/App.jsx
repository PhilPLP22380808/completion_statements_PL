import React, { useState } from 'react';
import Wizard from './modes/Wizard';
import ApportionmentOnly from './modes/ApportionmentOnly';
import StatementBuilder from './modes/StatementBuilder';
import LinkedBuilder from './modes/LinkedBuilder';

export default function App() {
  const [mode, setMode] = useState('home');
  const goHome = () => setMode('home');

  switch (mode) {
    case 'apportionment':
      return <ApportionmentOnly onHome={goHome} />;
    case 'purchase':
      return <StatementBuilder matterType="purchase" onHome={goHome} />;
    case 'sale':
      return <StatementBuilder matterType="sale" onHome={goHome} />;
    case 'linked':
      return <LinkedBuilder onHome={goHome} />;
    default:
      return <Wizard onPick={setMode} />;
  }
}
