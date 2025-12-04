import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage, getSession } from '../../../services/aiService';
import { Mermaid } from '../../../components/shared/Mermaid';
import './ChatInterface.css';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  currentSessionId?: string;
  onSessionUpdate: () => void;
  onSessionCreated: (sessionId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentSessionId, onSessionUpdate, onSessionCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // We track the active session ID internally as well to handle the "first message creates session" case
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(currentSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync with prop
  useEffect(() => {
    setActiveSessionId(currentSessionId);
    if (currentSessionId) {
      loadSession(currentSessionId);
    } else {
      setMessages([]); // Clear chat for new session
    }
  }, [currentSessionId]);

  const loadSession = async (id: string) => {
    setIsLoading(true);
    try {
      const session = await getSession(id);
      const formattedMessages: Message[] = session.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading session", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && selectedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage.content, selectedFiles, undefined, activeSessionId);
      
      if (response.sessionId) {
        if (activeSessionId !== response.sessionId) {
            setActiveSessionId(response.sessionId);
            onSessionCreated(response.sessionId); // Notify parent
            // Notify parent to refresh history list
            setTimeout(onSessionUpdate, 1000); 
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setSelectedFiles([]); // Clear files after sending
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Start a conversation with the Strategy AI.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-bubble">
              {msg.sender === 'ai' ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isMermaid = match && match[1] === 'mermaid';

                      if (isMermaid) {
                        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                      }

                      return match ? (
                        <div className="code-block">
                            <pre {...props} className={className}>
                                <code>{children}</code>
                            </pre>
                        </div>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
              <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-area">
        {selectedFiles.length > 0 && (
          <div className="file-preview">
            Attached: {selectedFiles.map(f => f.name).join(', ')}
          </div>
        )}
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            id="file-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="icon-button" title="Attach files">
            📎
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about strategy or upload a PDF..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || (!prompt && selectedFiles.length === 0)}>
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
