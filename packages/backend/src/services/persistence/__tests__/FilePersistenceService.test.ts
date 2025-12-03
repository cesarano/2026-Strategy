import { FilePersistenceService, ChatSession } from '../FilePersistenceService';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FilePersistenceService', () => {
  let service: FilePersistenceService;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), 'strat-test-data-' + Date.now());
    service = new FilePersistenceService(testDir);
    await service['ensureDataDir']();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('should save and retrieve a chat session', async () => {
    const session: ChatSession = {
      id: 'test-session-1',
      messages: [
        { id: '1', sender: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        { id: '2', sender: 'ai', content: 'Hi there', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await service.saveChatSession(session);

    const retrieved = await service.getChatSession('test-session-1');
    expect(retrieved).toEqual(session);
  });

  it('should return null for non-existent session', async () => {
    const retrieved = await service.getChatSession('non-existent');
    expect(retrieved).toBeNull();
  });

  it('should list all chat sessions', async () => {
    const session1: ChatSession = {
      id: 'session-1',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date(Date.now() - 1000).toISOString(),
    };
    const session2: ChatSession = {
      id: 'session-2',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await service.saveChatSession(session1);
    await service.saveChatSession(session2);

    const sessions = await service.getAllChatSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe('session-2'); // Most recent first
    expect(sessions[1].id).toBe('session-1');
  });
});
