import fs from 'fs/promises';
import path from 'path';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export class FilePersistenceService {
  private dataDir: string;

  constructor(baseDir: string = 'data') {
    this.dataDir = path.resolve(process.cwd(), baseDir);
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    const filePath = path.join(this.dataDir, `chat-${session.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
  }

  async getChatSession(id: string): Promise<ChatSession | null> {
    const filePath = path.join(this.dataDir, `chat-${id}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as ChatSession;
    } catch (error) {
      return null;
    }
  }

  async getAllChatSessions(): Promise<ChatSession[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      const sessions: ChatSession[] = [];
      
      for (const file of files) {
        if (file.startsWith('chat-') && file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
          sessions.push(JSON.parse(data));
        }
      }
      
      return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      return [];
    }
  }
}
