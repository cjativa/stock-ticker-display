import http  from 'http';
import https from 'https';
import fs    from 'fs';
import path  from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = 3000;

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
};

function handleLogoProxy(req, res) {
  const raw = req.url.split('?url=')[1];
  if (!raw) { res.statusCode = 400; res.end('missing url'); return; }
  const url = decodeURIComponent(raw);
  const client = url.startsWith('https') ? https : http;
  client.get(url, upstream => {
    res.writeHead(upstream.statusCode, {
      'Content-Type': upstream.headers['content-type'] || 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });
    upstream.pipe(res);
  }).on('error', () => { res.statusCode = 502; res.end('proxy error'); });
}

function handleStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.resolve(DIST, '.' + urlPath);
  if (!filePath.startsWith(DIST + path.sep) && filePath !== DIST) {
    res.statusCode = 403; res.end('forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // fall back to index.html so deep refreshes still work
      fs.readFile(path.join(DIST, 'index.html'), (err2, html) => {
        if (err2) { res.statusCode = 404; res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }
    const mime = MIME[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/logo')) handleLogoProxy(req, res);
  else handleStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('LED Ticker running at http://localhost:' + PORT);
});
