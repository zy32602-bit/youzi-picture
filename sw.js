const CACHE_NAME = 'yozi-cat-v1';
const STATIC_ASSETS = [
  '/yozi-cat/',
  '/yozi-cat/index.html',
  '/yozi-cat/styles.css',
  '/yozi-cat/app.js',
  '/yozi-cat/manifest.json',
  '/yozi-cat/icons/icon-192.svg',
  '/yozi-cat/icons/icon-512.svg'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: CacheFirst strategy for static, NetworkFirst for data
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // CacheFirst for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          // Cache new static assets
          const isStatic = STATIC_ASSETS.some(path =>
            url.pathname.includes(path) ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.html')
          );
          if (isStatic) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          if (url.pathname === '/yozi-cat/' || url.pathname === '/yozi-cat/index.html') {
            return caches.match('/yozi-cat/index.html');
          }
        });
    })
  );
});

// Background sync for data (optional enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-records') {
    console.log('[SW] Background sync triggered');
  }
});
