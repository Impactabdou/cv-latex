import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Router
app.use('/api', apiRouter);

// Static assets (LaTeX public files, photos, dist build)
app.use('/latex-assets', express.static(path.join(rootDir, 'public', 'data', 'latex')));
app.use(express.static(path.join(rootDir, 'dist')));

// SPA fallback for frontend routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/latex-assets')) {
    return next();
  }
  const indexPath = path.join(rootDir, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send('LaTeX CV Studio Backend is running. Launch Vite client for UI.');
    }
  });
});

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server/index.js') || 
  process.argv[1].endsWith('server/index')
);

if (isDirectRun || (!process.env.TEST_MODE && process.env.NODE_ENV !== 'test')) {
  app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 LaTeX CV Studio Backend running on port ${PORT}`);
    console.log(`📁 LaTeX data directory: public/data/latex/`);
    console.log(`===========================================`);
  });
}

export default app;
