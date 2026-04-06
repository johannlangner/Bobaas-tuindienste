// Bobaas Tuindienste — Service Worker
// Caches the app for offline use

const CACHE_NAME = 'bobaas-v3';
const URLS_TO_CACHE = [
  '/bobaas/',
  '/bobaas/index.html',
  '/bobaas/manifest.json',
  '/bobaas/icon.svg',
  'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=DM+Mono:wght@400;500&display=swap'
];

// Install — pre-cache all core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Bobaas v3');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache what we can, ignore failures (fonts may fail without network)
        return Promise.allSettled(
          URLS_TO_CACHE.map(url => cache.add(url).catch(e => console.warn('[SW] Could not cache:', url, e)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Bobaas v3');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for app shell, network-first for everything else
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always serve app shell from cache
  if (url.pathname.startsWith('/bobaas/') || url.pathname === '/bobaas') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('/bobaas/index.html'));
      })
    );
    return;
  }

  // For fonts and other resources: network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
