import React, { useEffect, useState } from 'react';
import { getSessions, type ChatSession } from '../services/aiService';
import './ChatHistory.css';

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
  refreshTrigger?: number; // Simple way to trigger a re-fetch
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectSession, currentSessionId, refreshTrigger }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (error) {
        console.error('Failed to load history', error);
      }
    };

    fetchSessions();
  }, [refreshTrigger]);

  return (
    <div className="chat-history">
      <h3>History</h3>
      <div className="session-list">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="session-date">
              {new Date(session.updatedAt).toLocaleDateString()}
            </div>
            <div className="session-preview">
              {session.messages[0]?.content.substring(0, 30) || 'New Chat'}...
            </div>
            <div className="session-time">
              {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
