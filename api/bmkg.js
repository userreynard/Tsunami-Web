/**
 * Vercel Serverless Function: Proxy API BMKG InaTEWS
 * Endpoint: /api/bmkg
 */
const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  https.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
    });
    apiRes.pipe(res);
  }).on('error', (err) => {
    res.writeHead(502, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Gagal menghubungi server BMKG: ' + err.message }));
  });
};
