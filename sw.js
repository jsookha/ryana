/**
 * Ryana Service Worker
 * Handles offline caching and asset management
 * Version: 1.0.0
 */

const CACHE_NAME = 'ryana-v1.0.0';
const RUNTIME_CACHE = 'ryana-runtime-v1.0.0';

// Assets to cache on install (critical files for offline use)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/themes.css',
  '/css/prism-theme.css', // this file does not exist
  '/js/app.js',
  '/js/db.js',
  '/js/ui.js',
  '/js/search.js',
  '/js/import-export.js',
  '/lib/prism.js',
  '/lib/prism.css',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

/**
 * INSTALL EVENT
 * Triggered when service worker is first installed
 * Caches all static assets for offline use
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

/**
 * ACTIVATE EVENT
 * Triggered when service worker becomes active
 * Cleans up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * FETCH EVENT
 * Intercepts network requests
 * Strategy: Cache First (offline-first approach)
 * - Try cache first
 * - If not in cache, fetch from network
 * - Cache successful network responses for future use
 */
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // If found in cache, return it
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response (can only be consumed once)
            const responseToCache = response.clone();

            // Cache the fetched response for future use
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Could return a custom offline page here
            // For now, just let it fail
            throw error;
          });
      })
  );
});

/**
 * MESSAGE EVENT
 * Handles messages from the main app
 * Used for cache updates, version checks, etc.
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});