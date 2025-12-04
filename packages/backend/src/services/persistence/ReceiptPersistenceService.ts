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
}
