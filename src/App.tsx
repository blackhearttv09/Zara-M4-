/**
 * M4 Five OS — Autonomous Operating System Entrypoint
 */

import React, { useState } from 'react';
import { BootScreen } from './components/BootScreen.tsx';
import { Desktop } from './components/Desktop.tsx';

export default function App() {
  const [isBooted, setIsBooted] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-slate-100 font-sans antialiased">
      {!isBooted ? (
        <BootScreen onBootComplete={() => setIsBooted(true)} />
      ) : (
        <Desktop />
      )}
    </div>
  );
}
