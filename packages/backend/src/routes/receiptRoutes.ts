import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises'; // Use fs.promises for async file operations
import { v4 as uuidv4 } from 'uuid';
import { ReceiptProcessor } from '../services/ai/ReceiptProcessor';
import { ReceiptPersistenceService, ReceiptData } from '../services/persistence/ReceiptPersistenceService';
import { ImageProcessingOptions } from '../services/ImageProcessorService'; // Import ImageProcessingOptions

const router = Router();
const receiptProcessor = new ReceiptProcessor();
const persistenceService = new ReceiptPersistenceService(); // Keep this for other routes

// Configure storage to save files to disk
const storage = multer.diskStorage({
  destination: async (req, file, cb) => { // Made async to use await for mkdir
    const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
    // Ensure directory exists
    if (!require('fs').existsSync(uploadDir)) { // Use synchronous fs for existsSync
      await fs.mkdir(uploadDir, { recursive: true }); // Use fs.promises.mkdir
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
    const fileBuffer = await fs.readFile(filePath); // Use fs.promises.readFile

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
      originalImageUrl: `/uploads/receipts/${filename}`, // Initialize original image URL
      displayImageUrl: `/uploads/receipts/${filename}`, // Display original by default
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

// PUT /api/receipts/:id - Update a receipt
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedReceipt = await persistenceService.updateReceipt(req.params.id, req.body);
    if (updatedReceipt) {
      res.json(updatedReceipt);
    } else {
      res.status(404).json({ error: 'Receipt not found' });
    }
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
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

// POST /api/receipts/:id/crop-enhance - Crop and enhance a receipt image
router.post('/:id/crop-enhance', async (req: Request, res: Response) => {
  try {
    const receiptId = req.params.id;
    const receipt = await persistenceService.getReceipt(receiptId);

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Get the original image path
    const originalFilename = path.basename(receipt.originalImageUrl);
    const originalImagePath = path.join(process.cwd(), 'uploads', 'receipts', originalFilename);

    if (!require('fs').existsSync(originalImagePath)) {
      return res.status(404).json({ error: 'Original image file not found' });
    }

    // Read the original image buffer
    const imageBuffer = await fs.readFile(originalImagePath);

    // Get image processing options from the request body
    const options: ImageProcessingOptions = req.body;

    // Call the new cropEnhanceReceiptImage method from ReceiptProcessor
    const { displayImageUrl } = await receiptProcessor.cropEnhanceReceiptImage(
      receiptId,
      imageBuffer,
      options
    );

    res.status(200).json({ message: 'Image crop-enhanced successfully', displayImageUrl });

  } catch (error) {
    console.error('Error crop-enhancing receipt image:', error);
    res.status(500).json({ error: 'Failed to crop and enhance receipt image' });
  }
});

// GET /api/receipts/:id/download-image - Download a receipt image
router.get('/:id/download-image', async (req: Request, res: Response) => {
  try {
    const receiptId = req.params.id;
    const receipt = await persistenceService.getReceipt(receiptId); // Changed to getReceipt

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Use displayImageUrl for download
    const filename = path.basename(receipt.displayImageUrl);
    const imagePath = path.join(process.cwd(), 'uploads', 'receipts', filename);

    const originalFs = require('fs');
    if (!originalFs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Set header to prompt download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(imagePath);

  } catch (error) {
    console.error('Error downloading receipt image:', error);
    res.status(500).json({ error: 'Failed to download receipt image' });
  }
});

// POST /api/receipts/:id/set-display-image - Set which image version to display
router.post('/:id/set-display-image', async (req: Request, res: Response) => {
  try {
    const receiptId = req.params.id;
    const { version } = req.body; // 'original' or 'optimized'

    if (version !== 'original' && version !== 'optimized') {
      return res.status(400).json({ error: 'Invalid version specified. Must be "original" or "optimized".' });
    }

    const receipt = await persistenceService.getReceipt(receiptId);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    let newDisplayImageUrl: string;
    if (version === 'original') {
      newDisplayImageUrl = receipt.originalImageUrl;
    } else { // version === 'optimized'
      if (!receipt.optimizedImageUrl) {
        return res.status(400).json({ error: 'Optimized image not available for this receipt.' });
      }
      newDisplayImageUrl = receipt.optimizedImageUrl;
    }

    receipt.displayImageUrl = newDisplayImageUrl;
    await persistenceService.saveReceipt(receipt);

    res.status(200).json({ message: 'Display image version updated successfully', displayImageUrl: newDisplayImageUrl });

  } catch (error) {
    console.error('Error setting display image version:', error);
    res.status(500).json({ error: 'Failed to set display image version' });
  }
});

export default router;