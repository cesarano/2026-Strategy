import request from 'supertest';
import express from 'express';

// 1. Mock the FilePersistenceService BEFORE importing aiRoutes
jest.mock('../../services/persistence/FilePersistenceService', () => {
  return {
    FilePersistenceService: jest.fn().mockImplementation(() => ({
      getChatSession: jest.fn().mockResolvedValue(null),
      saveChatSession: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// 2. Import aiRoutes AFTER the mock
import aiRoutes from '../aiRoutes';

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI Routes', () => {
  it('should handle a simple text prompt', async () => {
    const response = await request(app)
      .post('/api/ai/chat')
      .field('prompt', 'Hello AI');

    expect(response.status).toBe(200);
    expect(response.body.content).toContain('Hello AI');
    expect(response.body.metadata).toBeDefined();
    expect(response.body.sessionId).toBeDefined(); // Check for sessionId
  });

  it('should handle a prompt with context (JSON)', async () => {
    const context = JSON.stringify({ user: 'test' });
    const response = await request(app)
      .post('/api/ai/chat')
      .field('prompt', 'With Context')
      .field('context', context);

    expect(response.status).toBe(200);
    expect(response.body.content).toContain('With Context');
  });

  it('should fail if prompt is missing', async () => {
    const response = await request(app)
      .post('/api/ai/chat')
      .field('context', '{}');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Prompt is required');
  });

  it('should handle file uploads', async () => {
    const fileBuffer = Buffer.from('File content');
    
    const response = await request(app)
      .post('/api/ai/chat')
      .field('prompt', 'Analyze file')
      .attach('files', fileBuffer, { filename: 'test.txt', contentType: 'text/plain' });

    expect(response.status).toBe(200);
    expect(response.body.content).toContain('I have analyzed the attached documents');
  });
});