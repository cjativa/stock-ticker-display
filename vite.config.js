import { defineConfig } from 'vite';

// Logo proxy middleware — fetches logo images server-side so the browser
// never makes a cross-origin canvas draw (which would taint the canvas and
// throw a SecurityError when we call getImageData).
function logoProxyPlugin() {
  async function handle(req, res) {
    const raw = req.url.split('?url=')[1];
    if (!raw) { res.statusCode = 400; res.end('missing url'); return; }
    const url = decodeURIComponent(raw);
    try {
      const upstream = await fetch(url);
      const buf = await upstream.arrayBuffer();
      res.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(Buffer.from(buf));
    } catch (err) {
      res.statusCode = 502;
      res.end('proxy error');
    }
  }

  return {
    name: 'logo-proxy',
    configureServer(server) {
      server.middlewares.use('/logo', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/logo', handle);
    },
  };
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  plugins: [logoProxyPlugin()],
});
