import path from 'path';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

export const RECEIPT_STORAGE_PATH = process.env.RECEIPT_STORAGE_PATH || path.join(process.cwd(), 'uploads', 'receipts');
