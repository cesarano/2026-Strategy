import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import path from 'path';
import aiRoutes from './routes/aiRoutes';
import receiptRoutes from './routes/receiptRoutes';
import { RECEIPT_STORAGE_PATH } from './config'; // Import the new config

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Explicitly serve the receipts storage path to match the frontend URL structure
app.use('/uploads/receipts', express.static(RECEIPT_STORAGE_PATH));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/ai', aiRoutes);
app.use('/api/receipts', receiptRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the backend!');
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
