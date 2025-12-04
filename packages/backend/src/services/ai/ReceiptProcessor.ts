import { AISpecialist, AIRequest } from './AISpecialist';
import { ReceiptData } from '../persistence/ReceiptPersistenceService';
import { v4 as uuidv4 } from 'uuid';

export class ReceiptProcessor {
  private aiSpecialist: AISpecialist;

  constructor() {
    this.aiSpecialist = new AISpecialist();
  }

  async processReceipt(imageBuffer: Buffer, mimeType: string, originalFilename: string): Promise<Partial<ReceiptData>> {
    const prompt = `
      You are a specialized Receipt Scanner AI.
      Analyze the provided image of a receipt.
      Extract the following information and return it as a strict JSON object:
      
      - storeName: (string, or null if not found)
      - date: (string in ISO 8601 format YYYY-MM-DD, or null)
      - totalAmount: (number, or null)
      - currency: (string, e.g., "USD", "EUR", or null)
      - category: (string, infer from items, e.g., "Groceries", "Dining", "Electronics", "Travel")
      - items: (array of objects with "name" (string), "price" (number), "quantity" (number, default 1))

      Ensure the JSON is valid. Do not include any markdown formatting like \`\`\`json. Just the raw JSON object.
    `;

    const request: AIRequest = {
      prompt: prompt,
      files: [{
        buffer: imageBuffer,
        mimeType: mimeType
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    try {
      const response = await this.aiSpecialist.processRequest(request);
      // Clean up response if it contains markdown code blocks despite the prompt
      let jsonString = response.content.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '');
      }
      
      const extractedData = JSON.parse(jsonString);
      return extractedData;
    } catch (error) {
      console.error('Receipt processing failed:', error);
      throw new Error('Failed to process receipt image.');
    }
  }
}
