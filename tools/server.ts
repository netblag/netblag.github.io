import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

  if (!isProd) {
    // In development mode, mount Vite middleware
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true, port: Number(PORT), host: '0.0.0.0' },
        appType: 'spa'
      });
      app.use(vite.middlewares);
      console.log(`[Dev] Vite dev server middleware mounted.`);
    } catch {
      // Fallback to static dist if vite not in middleware mode
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    // In production mode, serve built dist bundle
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true
    }));

    // SPA fallback
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Lexi Book Web running at http://0.0.0.0:${PORT} (Mode: ${isProd ? 'Production' : 'Development'})`);
  });
}

startServer();
