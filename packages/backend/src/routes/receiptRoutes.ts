import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ReceiptProcessor } from '../services/ai/ReceiptProcessor';
import { ReceiptPersistenceService, ReceiptData } from '../services/persistence/ReceiptPersistenceService';

const router = Router();
const receiptProcessor = new ReceiptProcessor();
const persistenceService = new ReceiptPersistenceService();

// Configure storage to save files to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET /api/receipts - List all receipts
router.get('/', async (req: Request, res: Response) => {
  try {
    const receipts = await persistenceService.getAllReceipts();
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/receipts - Upload and process a receipt
router.post('/', upload.single('receiptImage'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  try {
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const filename = req.file.filename; // Saved filename on disk
    
    // Read file buffer for AI processing
    const fileBuffer = fs.readFileSync(filePath);

    // Process with AI
    const extractedData = await receiptProcessor.processReceipt(fileBuffer, mimeType, req.file.originalname);

    // Construct final Receipt Data
    const receiptId = uuidv4();
    const newReceipt: ReceiptData = {
      id: receiptId,
      storeName: extractedData.storeName || 'Unknown Store',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      totalAmount: extractedData.totalAmount || 0,
      currency: extractedData.currency || 'USD',
      category: extractedData.category || 'Uncategorized',
      items: extractedData.items || [],
      imageUrl: `/uploads/receipts/${filename}`, // Relative URL for frontend
      createdAt: new Date().toISOString(),
    };

    // Save to persistence
    await persistenceService.saveReceipt(newReceipt);

    res.json(newReceipt);

  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

// DELETE /api/receipts/:id - Delete a receipt
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await persistenceService.deleteReceipt(req.params.id);
    if (success) {
      res.status(200).json({ message: 'Receipt deleted successfully' });
    } else {
      res.status(404).json({ error: 'Receipt not found' });
    }
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
