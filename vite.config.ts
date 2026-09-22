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
          // Modern CSRF defense: block cross-site requests via Sec-Fetch-Site
          const secFetchSite = req.headers['sec-fetch-site'];
          if (secFetchSite === 'cross-site') {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Cross-site request blocked via Sec-Fetch-Site.' }));
            return;
          }

          // Verify request origin / referer to mitigate cross-site request forgery
          const originHeader = req.headers['origin'] || req.headers['referer'];
          if (originHeader) {
            try {
              const originHost = new URL(String(originHeader)).hostname.toLowerCase();
              const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
              if (!allowedHosts.has(originHost)) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: 'Cross-origin request from untrusted origin is blocked.' }));
                return;
              }
            } catch {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'Malformed Origin or Referer header.' }));
              return;
            }
          }

          const MAX_BODY_BYTES = 64 * 1024; // 64KB limit for URL import payload
          let body = '';
          let bytesReceived = 0;
          let aborted = false;

          req.on('data', (chunk) => {
            if (aborted) return;
            bytesReceived += chunk.length;
            if (bytesReceived > MAX_BODY_BYTES) {
              aborted = true;
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'Payload Too Large: import request exceeds 64KB limit' }));
              req.destroy();
              return;
            }
            body += chunk;
          });

          req.on('end', async () => {
            if (aborted) return;
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

        // 2. Static course-data serving with path traversal and symlink protection
        if (req.url && (req.url.startsWith('/course-data/') || req.url === '/course-data')) {
          const cleanUrl = req.url.split('?')[0];
          const relativePath = decodeURIComponent(cleanUrl.replace(/^\/course-data\/?/, ''));
          const courseDataDir = path.resolve(projectRoot, 'course-data');
          const targetPath = relativePath
            ? path.resolve(courseDataDir, relativePath)
            : courseDataDir;

          // Prevent directory traversal
          if (!targetPath.startsWith(courseDataDir + path.sep) && targetPath !== courseDataDir) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Access denied');
            return;
          }

          // Check if file exists, verify realpath to block symlink traversal, and restrict to .json / .md
          if (fs.existsSync(targetPath)) {
            try {
              const lstat = fs.lstatSync(targetPath);
              if (lstat.isSymbolicLink()) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Access denied: Symbolic links are forbidden');
                return;
              }

              const realTarget = fs.realpathSync(targetPath);
              const realCourseDataDir = fs.realpathSync(courseDataDir);
              if (!realTarget.startsWith(realCourseDataDir + path.sep) && realTarget !== realCourseDataDir) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Access denied');
                return;
              }

              if (lstat.isFile()) {
                if (targetPath.endsWith('.json')) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  return fs.createReadStream(targetPath).pipe(res);
                } else if (targetPath.endsWith('.md')) {
                  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
                  return fs.createReadStream(targetPath).pipe(res);
                } else {
                  res.statusCode = 403;
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                  res.end('Access denied: Only .json and .md files are served');
                  return;
                }
              }
            } catch {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end('Access denied');
              return;
            }
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
