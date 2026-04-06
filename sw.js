// Bobaas Tuindienste — Service Worker
const CACHE_NAME = 'bobaas-v4';

const URLS_TO_CACHE = [
  '/Bobaas-tuindienste/',
  '/Bobaas-tuindienste/index.html',
  '/Bobaas-tuindienste/manifest.json',
  '/Bobaas-tuindienste/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        URLS_TO_CACHE.map(url => cache.add(url).catch(e => console.warn('[SW] skip:', url)))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/Bobaas-tuindienste/index.html'));
    })
  );
});
