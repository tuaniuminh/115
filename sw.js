/* ==========================================================================
   SERVICE WORKER - SƠ CỨU 115 PWA
   ========================================================================== */

const CACHE_NAME = 'caching-v1.0.0';

// List of core files to cache for offline-first operation
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon.svg'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Activate Event - Clean up outdated caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Immediately take control of all clients
  );
});

// Fetch Event - Serve cached assets when offline
self.addEventListener('fetch', event => {
  // Only handle local GET requests (or standard scheme, ignore chrome-extension / external APIs)
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Cache-first strategy for local assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Fallback to network, and dynamically cache if it's a valid local asset
          return fetch(event.request).then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return networkResponse;
          });
        })
    );
  } else {
    // Network-first for cross-origin assets (e.g., Google Fonts) to allow offline fallback
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Cache fonts/styles dynamically
          if (networkResponse && networkResponse.status === 200 && (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com'))) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, check cache
          return caches.match(event.request);
        })
    );
  }
});

// Message listener for skip waiting manual updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
