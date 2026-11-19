// Sunset Press — a tiny static file server for trying the app locally.
// Serves app/ on http://localhost:8080 by default. Local testing only;
// the entry itself is plain static files and needs no server to be graded.
//
// Usage: node serve.ts [port]

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(fileURLToPath(new URL('.', import.meta.url)), 'app');
const port = Number(process.argv[2] ?? 8080);

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = join(appRoot, normalize(rel));
    if (file !== appRoot && !file.startsWith(appRoot + sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': mimeTypes[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(port, () => {
  console.log(`Sunset Press at http://localhost:${port}`);
});
