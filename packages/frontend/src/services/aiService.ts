import axios from 'axios';

// Define the base URL for the API. 
// In a real app, this would likely be an environment variable.
// Since we are using the proxy in Vite or assuming same-origin in prod, we can use relative path or explicit.
// But for development with separate ports (3001 vs 5173), we need to point to 3001 or configure Vite proxy.
// Let's assume we will configure Vite proxy to avoid CORS issues and hardcoding URLs.
const API_URL = '/api/ai';

export interface AIResponse {
  content: string;
  sessionId: string;
  metadata?: {
    timestamp: string;
    model: string;
    filesProcessed: number;
  };
}

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

export const getSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await axios.get<ChatSession[]>(`${API_URL}/sessions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const getSession = async (id: string): Promise<ChatSession> => {
  try {
    const response = await axios.get<ChatSession>(`${API_URL}/sessions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
};

export const sendMessage = async (prompt: string, files?: File[], context?: Record<string, any>, sessionId?: string): Promise<AIResponse> => {
  const formData = new FormData();
  formData.append('prompt', prompt);

  if (sessionId) {
    formData.append('sessionId', sessionId);
  }

  if (context) {
    formData.append('context', JSON.stringify(context));
  }

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  try {
    const response = await axios.post<AIResponse>(`${API_URL}/chat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message to AI:', error);
    throw error;
  }
};
