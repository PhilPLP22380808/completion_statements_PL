import React, { useState } from 'react';
import Wizard from './modes/Wizard';
import ApportionmentOnly from './modes/ApportionmentOnly';
import StatementBuilder from './modes/StatementBuilder';
import LinkedBuilder from './modes/LinkedBuilder';
import History from './modes/History';
import { restoreEntry } from './lib/history';

export default function App() {
  const [mode, setMode] = useState('home');
  const [nonce, setNonce] = useState(0); // bump to force a builder remount on reload
  const goHome = () => setMode('home');

  const reloadFromHistory = (entry) => {
    restoreEntry(entry);
    setNonce((n) => n + 1);
    setMode(entry.mode);
  };

  switch (mode) {
    case 'apportionment':
      return <ApportionmentOnly key={`apportionment-${nonce}`} onHome={goHome} />;
    case 'purchase':
      return <StatementBuilder key={`purchase-${nonce}`} matterType="purchase" onHome={goHome} />;
    case 'sale':
      return <StatementBuilder key={`sale-${nonce}`} matterType="sale" onHome={goHome} />;
    case 'linked':
      return <LinkedBuilder key={`linked-${nonce}`} onHome={goHome} />;
    case 'history':
      return <History onHome={goHome} onReload={reloadFromHistory} />;
    default:
      return <Wizard onPick={setMode} />;
  }
}
