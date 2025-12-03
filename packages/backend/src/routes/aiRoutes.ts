import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AISpecialist } from '../services/ai/AISpecialist';
import { FilePersistenceService, ChatSession, ChatMessage } from '../services/persistence/FilePersistenceService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const aiSpecialist = new AISpecialist();
const persistenceService = new FilePersistenceService();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

interface ChatRequest extends Request {
  body: {
    prompt: string;
    context?: string; // Received as JSON string from multipart form
    sessionId?: string;
  };
}

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = await persistenceService.getAllChatSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const session = await persistenceService.getChatSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/chat', upload.array('files'), async (req: Request, res: Response) => {
  try {
    const { prompt, context, sessionId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return; 
    }

    let parsedContext: Record<string, any> | undefined;
    if (context) {
      try {
        parsedContext = JSON.parse(context);
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON in context' });
        return;
      }
    }

    const aiFiles = files?.map((file) => ({
      buffer: file.buffer,
      mimeType: file.mimetype,
    }));

    const response = await aiSpecialist.processRequest({
      prompt,
      context: parsedContext,
      files: aiFiles,
    });

    // Persistence Logic
    const currentSessionId = sessionId || uuidv4();
    let session = await persistenceService.getChatSession(currentSessionId);

    if (!session) {
      session = {
        id: currentSessionId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    const aiMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'ai',
      content: response.content,
      timestamp: new Date().toISOString(),
      metadata: response.metadata,
    };

    session.messages.push(userMessage, aiMessage);
    session.updatedAt = new Date().toISOString();

    await persistenceService.saveChatSession(session);

    res.json({ ...response, sessionId: currentSessionId });
  } catch (error) {
    console.error('Error processing AI request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
