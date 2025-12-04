import fs from 'fs/promises';
import path from 'path';

export interface ReceiptItem {
  name: string;
  price: number | null;
  quantity?: number;
}

export interface ReceiptData {
  id: string;
  storeName: string | null;
  date: string | null;
  totalAmount: number | null;
  currency: string | null;
  category: string | null;
  items: ReceiptItem[];
  imageUrl: string;
  createdAt: string;
}

export class ReceiptPersistenceService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'receipts');
  }

  async saveReceipt(receipt: ReceiptData): Promise<void> {
    const filePath = path.join(this.dataDir, `${receipt.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(receipt, null, 2));
  }

  async getAllReceipts(): Promise<ReceiptData[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      const receipts: ReceiptData[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
          try {
            receipts.push(JSON.parse(content));
          } catch (e) {
            console.error(`Failed to parse receipt file: ${file}`, e);
          }
        }
      }
      
      // Sort by date (newest first)
      return receipts.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt).getTime();
        const dateB = new Date(b.date || b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error reading receipt directory:', error);
      return [];
    }
  }

  async getReceipt(id: string): Promise<ReceiptData | null> {
    try {
      const filePath = path.join(this.dataDir, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async deleteReceipt(id: string): Promise<boolean> {
    try {
      // 1. Get receipt to find the image path
      const receipt = await this.getReceipt(id);
      if (!receipt) return false;

      // 2. Delete JSON file
      const jsonPath = path.join(this.dataDir, `${id}.json`);
      await fs.unlink(jsonPath);

      // 3. Delete Image file
      if (receipt.imageUrl) {
        // receipt.imageUrl is like "/uploads/receipts/filename.jpg"
        // We need to resolve this relative to project root
        // The imageUrl starts with a slash, so we strip it or handle it.
        // process.cwd() is usually the package root or project root.
        // backend runs from packages/backend usually, but let's be safe.
        // based on previous file uploads: path.join(process.cwd(), 'uploads', 'receipts')
        
        // If imageUrl is "/uploads/receipts/xyz.jpg", we can just join it with process.cwd() removing the leading slash
        const relativePath = receipt.imageUrl.startsWith('/') ? receipt.imageUrl.slice(1) : receipt.imageUrl;
        const imagePath = path.join(process.cwd(), relativePath);
        
        try {
          await fs.unlink(imagePath);
        } catch (imgErr) {
          console.warn(`Failed to delete image at ${imagePath}`, imgErr);
          // We don't fail the whole operation if image delete fails (maybe already gone)
        }
      }

      return true;
    } catch (error) {
      console.error(`Error deleting receipt ${id}:`, error);
      return false;
    }
  }
}
