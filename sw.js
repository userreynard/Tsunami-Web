const CACHE_NAME = 'tsunami-id-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/peta.html',
  '/katalog.html',
  '/mitigasi.html',
  '/kontak.html',
  '/css/style.css',
  '/js/api.js',
  '/js/app.js',
  '/js/map.js',
  '/data/tsunamis.js',
  '/manifest.json',
  '/assets/icon-wave.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// Install: Cache all static app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic APIs (/api/bmkg, /api/noaa), Cache-first with network fallback for static files
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Jika permintaan API (/api/bmkg atau /api/noaa): Coba jaringan terlebih dahulu, simpan ke cache
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Untuk aset statis (HTML, CSS, JS, Gambar): Cache-first dengan network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Ambil versi terbaru di background jika ada jaringan (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      }).catch(() => {
        // Jika offline dan membuka navigasi, arahkan ke index.html yang sudah dicache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});