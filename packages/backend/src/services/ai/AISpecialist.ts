import fs from 'fs';
import { GoogleGenerativeAI, Part, GenerationConfig } from '@google/generative-ai';
const pdf = require('pdf-parse');

export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  files?: {
    path?: string;
    buffer?: Buffer;
    mimeType: string;
  }[];
  generationConfig?: GenerationConfig;
}

export interface AIResponse {
  content: string;
  metadata?: Record<string, any>;
}

/**
 * The AISpecialist agent responsible for handling AI-related tasks.
 * Supports text-only and multimodal inputs (images, PDFs).
 */
export class AISpecialist {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        systemInstruction: `You are an expert strategy assistant.
When explaining complex processes, relationships, timelines, or structures, ALWAYS visualize them using Mermaid.js diagrams.

Output Mermaid code block:
\`\`\`mermaid
[diagram code here]
\`\`\`

MERMAID BEST PRACTICES & SYNTAX RULES:
1. DIAGRAM TYPE: Use \`flowchart TD\` (Top-Down) or \`flowchart LR\` (Left-Right). Do NOT use \`graph\`.
2. IDs: Use simple, alphanumeric strings (e.g., \`node1\`, \`subA\`). NO spaces, NO special characters.
3. LABELS:
   - Wrap complex labels in DOUBLE QUOTES: \`id["Label Text with (Chars)"]\`.
   - Do NOT use double quotes inside the label itself (use single quotes).
   - NO brackets () [] {} in unquoted labels.
4. SUBGRAPHS:
   - Format: \`subgraph id [Label Text]\`
   - Do NOT put quotes around the label text inside the brackets.
   - IDs must be simple (e.g., \`subgraph_cloud\`).
5. CONNECTIONS:
   - Connect NODES only. NEVER connect to/from a Subgraph ID.
   - Use consistent arrow styles: \`-->\` (standard), \`-.->\` (dotted), \`==>\` (thick).
6. STYLING:
   - Use \`classDef\` for shared styles.
   - Example: \`classDef cloud fill:#eef,stroke:#333; class node1,node2 cloud;\`
` 
      });
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
    const parts: Part[] = [];
    
    // 1. Add the main prompt
    let mainPrompt = request.prompt;
    if (request.context) {
      mainPrompt += `\n\nAdditional Context:\n${JSON.stringify(request.context, null, 2)}`;
    }
    parts.push({ text: mainPrompt });

    // 2. Process files
    let filesProcessed = 0;
    if (request.files && request.files.length > 0) {
      for (const file of request.files) {
        const sourceName = file.path || 'uploaded-file';
        
        try {
          if (file.mimeType.startsWith('image/')) {
            // Handle Images (Multimodal)
            const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
            if (!buffer) throw new Error('No image data found');
            
            parts.push({
              inlineData: {
                data: buffer.toString('base64'),
                mimeType: file.mimeType
              }
            });
          } else {
             // Handle Text/PDF (Extract text and append)
            const content = await this.extractTextFromFile(file, file.mimeType);
            parts.push({ text: `\n\n--- Start of file: ${sourceName} ---\n${content}\n--- End of file ---` });
          }
          filesProcessed++;
        } catch (error) {
          console.error(`Failed to process file ${sourceName}:`, error);
          parts.push({ text: `\n[Error reading file: ${sourceName}]` });
        }
      }
    }

    let responseContent: string;
    let modelName = 'mock-model-v2';

    if (this.model) {
      try {
        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig: request.generationConfig
        });
        const response = await result.response;
        responseContent = response.text();
        modelName = 'gemini-2.0-flash';
      } catch (error) {
        console.error('Error generating content with Gemini:', error);
        responseContent = `[Error interacting with AI Provider]. Falling back to mock. \n\n` + this.simulateAIResponse(request.prompt);
      }
    } else {
      responseContent = this.simulateAIResponse(request.prompt);
    }

    return {
      content: responseContent,
      metadata: {
        timestamp: new Date().toISOString(),
        model: modelName,
        filesProcessed: filesProcessed,
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
