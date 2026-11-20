// Sunset Press — tiny static file server for local development only.
// Serves app/ at http://localhost:8080 (node serve.ts [port]).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), 'app');
const port = Number(process.argv[2] || 8080);

const types = new Map([
  ['.html', 'text/html'],
  ['.css', 'text/css'],
  ['.js', 'text/javascript'],
  ['.mjs', 'text/javascript'],
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain'],
  ['.json', 'application/json'],
]);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const file = join(appRoot, decodeURIComponent(rel));
    if (!file.startsWith(appRoot)) throw new Error('outside app root');
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types.get(extname(file)) || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(port, () => console.log(`Sunset Press serving ${appRoot} on http://localhost:${port}`));
