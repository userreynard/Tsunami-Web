/**
 * Vercel Serverless Function: Proxy API NOAA NCEI Tsunami Hazard
 * Endpoint: /api/noaa
 */
const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Teruskan query parameter jika ada, atau gunakan default Indonesia dari tahun 1900 ke atas
  // (Menggunakan minYear=1900 memastikan peristiwa modern 2018 Palu, Krakatau, dll. tidak terpotong oleh batas 200 data tertua)
  const incomingUrl = new URL(req.url || '', 'http://localhost');
  const params = incomingUrl.searchParams;

  if (!params.has('country') && !params.has('minYear')) {
    params.set('country', 'INDONESIA');
    params.set('minYear', '1900');
  } else if (params.get('country') === 'INDONESIA' && !params.has('minYear') && !params.has('page')) {
    params.set('minYear', '1900');
  }

  const targetPath = `/hazel/hazard-service/api/v1/tsunamis/events?${params.toString()}`;

  const options = {
    hostname: 'www.ngdc.noaa.gov',
    path: targetPath,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  };

  https.get(options, (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200'
    });
    apiRes.pipe(res);
  }).on('error', (err) => {
    res.writeHead(502, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Gagal menghubungi server NOAA: ' + err.message }));
  });
};
