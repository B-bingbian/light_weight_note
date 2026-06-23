import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './db/connection.js';
import notesRouter from './routes/notes.js';
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main(): Promise<void> {
  // Initialize database (creates tables if needed)
  await initDatabase();
  console.log('[DB] Database initialized');

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/upload', uploadRouter);

  // Serve uploaded files
  const uploadsPath = path.join(__dirname, '..', 'data', 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Serve static files (built Vue SPA)
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDistPath));

  // SPA catch-all — serve index.html for client-side routing
  app.get('*', (_req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).json({
        message: 'Notes API server is running. Frontend not built yet.',
        hint: 'Run "cd client && npm run build" to build the frontend.',
      });
    }
  });

  // Error handler (must be last)
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`[Server] Notes server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
