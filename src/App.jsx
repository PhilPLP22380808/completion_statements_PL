import React, { useState } from 'react';
import Wizard from './modes/Wizard';
import ApportionmentOnly from './modes/ApportionmentOnly';
import StatementBuilder from './modes/StatementBuilder';
import LinkedBuilder from './modes/LinkedBuilder';
import History from './modes/History';
import { restoreEntry, MODE_STORAGE_KEY } from './lib/history';

export default function App() {
  const [mode, setMode] = useState('home');
  const [nonce, setNonce] = useState(0); // bump to force a builder remount on reload
  const goHome = () => setMode('home');

  const startNew = (picked) => {
    try { if (MODE_STORAGE_KEY[picked]) localStorage.removeItem(MODE_STORAGE_KEY[picked]); } catch (e) { /* ignore */ }
    setNonce((n) => n + 1);
    setMode(picked);
  };
  const goHistory = () => setMode('history');

  const reloadFromHistory = (entry) => {
    restoreEntry(entry);
    setNonce((n) => n + 1);
    setMode(entry.mode);
  };

  switch (mode) {
    case 'apportionment':
      return <ApportionmentOnly key={`apportionment-${nonce}`} onHome={goHome} onHistory={goHistory} />;
    case 'purchase':
      return <StatementBuilder key={`purchase-${nonce}`} matterType="purchase" onHome={goHome} onHistory={goHistory} />;
    case 'sale':
      return <StatementBuilder key={`sale-${nonce}`} matterType="sale" onHome={goHome} onHistory={goHistory} />;
    case 'linked':
      return <LinkedBuilder key={`linked-${nonce}`} onHome={goHome} onHistory={goHistory} />;
    case 'history':
      return <History onHome={goHome} onReload={reloadFromHistory} />;
    default:
      return <Wizard onContinue={setMode} onNew={startNew} />;
  }
}
