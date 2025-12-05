import { AISpecialist, AIRequest } from './AISpecialist';
import { ReceiptData, ReceiptPersistenceService } from '../persistence/ReceiptPersistenceService';
import { v4 as uuidv4 } from 'uuid';
import { ImageProcessorService, ImageProcessingOptions } from '../ImageProcessorService';
import path from 'path';
import fs from 'fs/promises'; // Use fs.promises for async file operations


export class ReceiptProcessor {
  private aiSpecialist: AISpecialist;
  private imageProcessorService: ImageProcessorService;
  private persistenceService: ReceiptPersistenceService;

  constructor() {
    this.aiSpecialist = new AISpecialist();
    this.imageProcessorService = new ImageProcessorService();
    this.persistenceService = new ReceiptPersistenceService();
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

  async cropEnhanceReceiptImage(
    receiptId: string,
    originalImageBuffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<{ displayImageUrl: string }> {
    try {
      const processedBuffer = await this.imageProcessorService.processImage(originalImageBuffer, options);

      // Save the optimized image to a new file and update receipt
      const optimizedFilename = `crop-enhanced-${receiptId}-${uuidv4()}.jpeg`; // Use jpeg for now, but format can be dynamic
      const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
      // Ensure directory exists
      if (!require('fs').existsSync(uploadDir)) {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      const optimizedImagePath = path.join(uploadDir, optimizedFilename);
      await fs.writeFile(optimizedImagePath, processedBuffer);

      // Update receipt data with the new optimized image path and set it as display
      const receipt = await this.persistenceService.getReceipt(receiptId);
      if (!receipt) {
        throw new Error('Receipt not found for enhancement.');
      }
      receipt.optimizedImageUrl = `/uploads/receipts/${optimizedFilename}`;
      receipt.displayImageUrl = receipt.optimizedImageUrl; // Set as display by default
      await this.persistenceService.saveReceipt(receipt);

      return { displayImageUrl: receipt.displayImageUrl };
    } catch (error) {
      console.error(`Error crop-enhancing image for receipt ${receiptId}:`, error);
      throw new Error('Failed to crop and enhance receipt image.');
    }
  }
}
