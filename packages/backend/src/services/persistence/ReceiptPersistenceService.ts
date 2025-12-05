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
  originalImageUrl: string; // Path to the original uploaded image
  optimizedImageUrl?: string; // Optional path to the optimized image
  displayImageUrl: string; // The URL currently selected for display (original or optimized)
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
            const receipt = JSON.parse(content);
            // --- Migration Logic for Older Receipts ---
            // If originalImageUrl is missing but imageUrl exists (older receipt format), migrate it
            if (!receipt.originalImageUrl && receipt.imageUrl) {
                receipt.originalImageUrl = receipt.imageUrl;
            }
            // Ensure displayImageUrl is set (use originalImageUrl as fallback)
            if (!receipt.displayImageUrl) {
                receipt.displayImageUrl = receipt.originalImageUrl;
            }
            // If originalImageUrl is still missing, it means no image URL was ever present
            // (e.g., if a receipt was created with only AI data and no image)
            // In a real app, this might need more robust handling. For now, we assume originalImageUrl will always be set.
            // --- End Migration Logic ---
            receipts.push(receipt);
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
      const receipt = JSON.parse(content);
      // --- Migration Logic for Older Receipts ---
      if (!receipt.originalImageUrl && receipt.imageUrl) {
          receipt.originalImageUrl = receipt.imageUrl;
      }
      if (!receipt.displayImageUrl) {
          receipt.displayImageUrl = receipt.originalImageUrl;
      }
      // --- End Migration Logic ---
      return receipt;
    } catch (error) {
      return null;
    }
  }

  async deleteReceipt(id: string): Promise<boolean> {
    try {
      // 1. Get receipt to find the image paths
      const receipt = await this.getReceipt(id);
      if (!receipt) return false;

      // 2. Delete JSON file
      const jsonPath = path.join(this.dataDir, `${id}.json`);
      await fs.unlink(jsonPath);

      // 3. Delete Original Image file
      if (receipt.originalImageUrl) {
        const originalImagePath = path.join(process.cwd(), receipt.originalImageUrl.startsWith('/') ? receipt.originalImageUrl.slice(1) : receipt.originalImageUrl);
        try {
          await fs.unlink(originalImagePath);
        } catch (imgErr) {
          console.warn(`Failed to delete original image at ${originalImagePath}`, imgErr);
        }
      }

      // 4. Delete Optimized Image file if it exists
      if (receipt.optimizedImageUrl) {
        const optimizedImagePath = path.join(process.cwd(), receipt.optimizedImageUrl.startsWith('/') ? receipt.optimizedImageUrl.slice(1) : receipt.optimizedImageUrl);
        try {
          await fs.unlink(optimizedImagePath);
        } catch (imgErr) {
          console.warn(`Failed to delete optimized image at ${optimizedImagePath}`, imgErr);
        }
      }

      return true;
    } catch (error) {
      console.error(`Error deleting receipt ${id}:`, error);
      return false;
    }
  }
}
