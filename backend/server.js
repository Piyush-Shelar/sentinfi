import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dotenvResult = dotenv.config({ path: path.resolve(__dirname, '.env') });
if (dotenvResult.error) {
  console.error('[startup] Failed to load .env file:', dotenvResult.error.message);
  process.exit(1);
}
console.log('[startup] .env loaded successfully');

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/document.js';
import dashboardRoutes from './routes/dashboard.js';
import advisorRoutes from './routes/advisors.js';
import adminRoutes from './routes/admin.js';
import { seedDummyAccounts } from './scripts/seed.js';
import { initKeyService } from './services/keyService.js';

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.message : reason);
  if (reason instanceof Error) console.error(reason.stack);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5001;

console.log('[startup] Express app created, PORT =', PORT);

if (!process.env.MONGO_URI) {
  console.error('[startup] MONGO_URI is missing from environment. Check your .env file.');
  process.exit(1);
}

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

console.log('[startup] Routes mounted');

initKeyService();

console.log('[startup] Connecting to MongoDB...');

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('[startup] MongoDB connected');
    console.log('[startup] Running seed...');
    await seedDummyAccounts();
    console.log('[startup] Seed complete');
    app.listen(PORT, () => {
      console.log(`[startup] Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[startup] MongoDB connection failed:', err.message);
    process.exit(1);
  });