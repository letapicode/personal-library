import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

import { importUniversalUrl } from './server/urlImporter.ts';

const projectRoot = import.meta.dirname || path.resolve('.');

function courseDataPlugin(): Plugin {
  return {
    name: 'course-data-server',
    configureServer(server) {
      // 1. API endpoint for server-side URL imports (ChatGPT, Claude, raw markdown)
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/import-url' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await importUniversalUrl(payload.url, payload.assistantOnly !== false);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: err.message || 'Failed to import from URL' }));
            }
          });
          return;
        }

        // 2. Static course-data serving with path traversal protection
        if (req.url && (req.url.startsWith('/course-data/') || req.url === '/course-data')) {
          const cleanUrl = req.url.split('?')[0];
          const relativePath = decodeURIComponent(cleanUrl.replace(/^\/course-data\/?/, ''));
          const courseDataDir = path.resolve(projectRoot, 'course-data');
          const targetPath = relativePath
            ? path.resolve(courseDataDir, relativePath)
            : courseDataDir;

          // Security: Prevent directory traversal outside course-data
          if (!targetPath.startsWith(courseDataDir + path.sep) && targetPath !== courseDataDir) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Access denied');
            return;
          }

          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            if (targetPath.endsWith('.json')) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
            } else if (targetPath.endsWith('.md')) {
              res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            }
            return fs.createReadStream(targetPath).pipe(res);
          }
        }
        next();
      });
    },
    closeBundle() {
      const srcDir = path.resolve(projectRoot, 'course-data');
      const destDir = path.resolve(projectRoot, 'dist', 'course-data');
      if (fs.existsSync(srcDir)) {
        try {
          fs.cpSync(srcDir, destDir, { recursive: true });
        } catch (e) {
          console.warn('Failed to copy course-data to dist:', e);
        }
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), courseDataPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
