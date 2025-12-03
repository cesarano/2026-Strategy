import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { ChatHistory } from './components/ChatHistory';
import './App.css';

function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleSessionUpdate = () => {
    setHistoryRefreshTrigger(prev => prev + 1);
  };

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
  };

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <h1>Strategy AI Assistant</h1>
          <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
        </div>
      </header>
      <main className="main-content">
        <div className="chat-area">
          <ChatInterface 
            currentSessionId={currentSessionId} 
            onSessionUpdate={handleSessionUpdate}
            onSessionCreated={handleSessionSelect}
          />
        </div>
        <div className="sidebar-area">
          <ChatHistory 
            onSelectSession={handleSessionSelect} 
            currentSessionId={currentSessionId}
            refreshTrigger={historyRefreshTrigger}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
