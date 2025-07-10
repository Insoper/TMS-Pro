const CACHE_NAME = 'tms-pro-cache-v2.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './chart.js',
  './html2canvas.min.js',
  './jspdf.umd.min.js',
  './jspdf.plugin.autotable.min.js',
  './xlsx.full.min.js',
  './service-worker.js',
  './proxy.html',
  './offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching assets for offline use');
        return cache.addAll(ASSETS_TO_CACHE)
          .catch(err => {
            console.error('Failed to cache some assets:', err);
            // Tetap lanjutkan meskipun ada yang gagal
            return Promise.resolve();
          });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network-first strategy with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the response if it's valid
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // For HTML requests, return index.html for SPA routing
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
        // For other requests, return from cache
        return caches.match(event.request);
      })
  );
});

// Background sync for offline data (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    console.log('Syncing offline data...');
    // Implement your offline data sync logic here
  }
});
