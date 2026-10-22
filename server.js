/**
 * ============================================================================
 * Local Web Server Bawaan Node.js (Tanpa Perlu Download Apapun)
 * ============================================================================
 * Mendukung IPv4 (127.0.0.1) & IPv6 (localhost)
 * Menggunakan modul bawaan 'http', 'https', 'fs', 'path'
 * Terintegrasi dengan Vercel Serverless Functions (/api/bmkg & /api/noaa)
 * Mendukung Clean URLs (/peta -> /peta.html) identik dengan produksi Vercel
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Menggunakan handler yang sama dengan Vercel Serverless Functions
const bmkgHandler = require('./api/bmkg.js');
const noaaHandler = require('./api/noaa.js');

let PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createServer() {
  const server = http.createServer((req, res) => {
    // 1. API PROXY: BMKG InaTEWS Autogempa
    if (req.url === '/api/bmkg' || req.url.startsWith('/api/bmkg?')) {
      bmkgHandler(req, res);
      return;
    }

    // 2. API PROXY: NOAA NCEI Tsunami Hazard Events
    if (req.url === '/api/noaa' || req.url.startsWith('/api/noaa?')) {
      noaaHandler(req, res);
      return;
    }

    // 3. STATIS FILE HANDLER
    let safePath = decodeURIComponent(req.url.split('?')[0]);
    if (safePath === '/' || safePath === '') {
      safePath = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, safePath);

    // Dukungan Clean URLs lokal (misal: /peta diarahkan ke /peta.html)
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Terlarang: Akses di luar direktori');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Tidak Ditemukan: ${safePath}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} sedang dipakai, mencoba port ${PORT + 1}...`);
      PORT++;
      try { server.close(); } catch (e) {}
      setTimeout(() => {
        createServer();
      }, 150);
    } else {
      console.error('Terjadi kesalahan pada server:', err);
    }
  });

  // Bind ke 0.0.0.0 agar dapat diakses via localhost maupun 127.0.0.1
  server.listen(PORT, '0.0.0.0', () => {
    const localUrl = `http://localhost:${PORT}`;
    const ipUrl = `http://127.0.0.1:${PORT}`;

    console.log('\n======================================================');
    console.log(' 🌊 PORTAL TSUNAMI INDONESIA BERJALAN!');
    console.log('======================================================');
    console.log(`\n  ► Alamat Utama:      \x1b[36m\x1b[1m${localUrl}\x1b[0m`);
    console.log(`  ► Alamat Alternatif: \x1b[33m\x1b[1m${ipUrl}\x1b[0m`);
    console.log(`  ► API Proxy BMKG:    \x1b[32m${localUrl}/api/bmkg\x1b[0m`);
    console.log(`  ► API Proxy NOAA:    \x1b[32m${localUrl}/api/noaa\x1b[0m`);
    console.log(`  ► Direktori Web:     ${ROOT_DIR}`);
    console.log('\n  (Tekan Ctrl+C di terminal ini untuk berhenti)\n');
    console.log('======================================================\n');
  });
}

createServer();
