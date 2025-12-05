import { useState } from 'react';
import { StrategyApp } from './apps/strategy/StrategyApp';
import { AIReceiptsApp } from './apps/ai-receipts/AIReceiptsApp';
import './App.css'; // Global styles for #root, etc.

type AppMode = 'strategy' | 'ai-receipts';

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('ai-receipts');

  const handleModeToggle = () => {
    setCurrentMode(prevMode => (prevMode === 'strategy' ? 'ai-receipts' : 'strategy'));
  };

  return (
    <div className={"app-container app-container--" + currentMode}> {/* Global container for mode-specific styling if needed */}
      <header>
        <div className="header-content">
          <h1>AI</h1>
          <button onClick={handleModeToggle}>
            Switch to {currentMode === 'strategy' ? 'AI Receipts' : 'Strategy'}
          </button>
        </div>
      </header>
      {currentMode === 'strategy' ? (
        <StrategyApp />
      ) : (
        <AIReceiptsApp />
      )}
    </div>
  );
}

export default App;
