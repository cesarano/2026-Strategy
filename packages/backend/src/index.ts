import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import aiRoutes from './routes/aiRoutes';

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.use('/api/ai', aiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the backend!');
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
