import { useState } from 'react';
import { StrategyApp } from './apps/strategy/StrategyApp';
import { Mode2App } from './apps/mode2/Mode2App';
import './App.css'; // Global styles for #root, etc.

type AppMode = 'strategy' | 'mode2';

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('strategy');

  const handleModeToggle = () => {
    setCurrentMode(prevMode => (prevMode === 'strategy' ? 'mode2' : 'strategy'));
  };

  return (
    <div className={"app-container app-container--" + currentMode}> {/* Global container for mode-specific styling if needed */}
      <header>
        <div className="header-content">
          <h1>AI</h1>
          <button onClick={handleModeToggle}>
            Switch to {currentMode === 'strategy' ? 'Mode 2' : 'Strategy'}
          </button>
        </div>
      </header>
      {currentMode === 'strategy' ? (
        <StrategyApp />
      ) : (
        <Mode2App />
      )}
    </div>
  );
}

export default App;
