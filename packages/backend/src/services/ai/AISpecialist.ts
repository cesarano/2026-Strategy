import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
const pdf = require('pdf-parse');

export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  files?: {
    path?: string;
    buffer?: Buffer;
    mimeType: string;
  }[];
}

export interface AIResponse {
  content: string;
  metadata?: Record<string, any>;
}

/**
 * The AISpecialist agent responsible for handling AI-related tasks.
 * Supports text-only and multimodal inputs (currently parsing PDFs for text content).
 */
export class AISpecialist {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } else {
      console.warn('GEMINI_API_KEY is not set. AI features will use mock responses.');
    }
  }

  /**
   * Processes a request using the AI model.
   * @param request The input request containing the prompt, context, and optional files.
   * @returns A promise resolving to the AI's response.
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    let enrichedPrompt = request.prompt;
    const fileContents: string[] = [];

    if (request.files && request.files.length > 0) {
      for (const file of request.files) {
        const sourceName = file.path || 'uploaded-file';
        try {
          const content = await this.extractTextFromFile(file, file.mimeType);
          fileContents.push(`--- Start of file: ${sourceName} ---\n${content}\n--- End of file ---`);
        } catch (error) {
          console.error(`Failed to process file ${sourceName}:`, error);
          fileContents.push(`[Error reading file: ${sourceName}]`);
        }
      }
    }

    if (fileContents.length > 0) {
      enrichedPrompt += `\n\nContext from attached files:\n${fileContents.join('\n\n')}`;
    }

    if (request.context) {
        enrichedPrompt += `\n\nAdditional Context:\n${JSON.stringify(request.context, null, 2)}`;
    }

    let responseContent: string;
    let modelName = 'mock-model-v2';

    if (this.model) {
      try {
        const result = await this.model.generateContent(enrichedPrompt);
        const response = await result.response;
        responseContent = response.text();
        modelName = 'gemini-2.0-flash';
      } catch (error) {
        console.error('Error generating content with Gemini:', error);
        responseContent = `[Error interacting with AI Provider]. Falling back to mock. \n\n` + this.simulateAIResponse(enrichedPrompt);
      }
    } else {
      responseContent = this.simulateAIResponse(enrichedPrompt);
    }

    return {
      content: responseContent,
      metadata: {
        timestamp: new Date().toISOString(),
        model: modelName,
        filesProcessed: request.files?.length || 0,
      },
    };
  }

  /**
   * Extracts text from a file based on its MIME type.
   * @param file The file object containing either a path or a buffer.
   * @param mimeType The MIME type of the file.
   * @returns The extracted text.
   */
  private async extractTextFromFile(file: { path?: string; buffer?: Buffer }, mimeType: string): Promise<string> {
    let dataBuffer: Buffer;

    if (file.buffer) {
      dataBuffer = file.buffer;
    } else if (file.path) {
      dataBuffer = fs.readFileSync(file.path);
    } else {
      throw new Error('File must have either a path or a buffer');
    }

    if (mimeType === 'application/pdf') {
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (mimeType.startsWith('text/')) {
      return dataBuffer.toString('utf-8');
    }

    return '[Unsupported file type]';
  }

  private simulateAIResponse(prompt: string): string {
     // Simple logic to show that the prompt was "understood"
     if (prompt.includes('Context from attached files')) {
         return `[AI Response]: I have analyzed the attached documents. Based on your request "${prompt.split('\n')[0]}", here is my analysis... (Mock)`;
     }
     return `[AI Response]: ${prompt}`;
  }
}
