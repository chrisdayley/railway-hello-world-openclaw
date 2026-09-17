const CACHE = 'everlight-v20-complete-hero';
const CORE = [
  './','./index.html','./manifest.webmanifest','./styles/game-v3.css','./js/game-v3.js',
  './assets/northford-twilight.jpg','./assets/hero-atlas-concept.png','./assets/hero-player-v2.png',
  './assets/mira-scout.png','./assets/hollow-warden.png',
  './icons/icon-192.svg','./icons/icon-512.svg','./icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    if (response && response.ok && response.type !== 'opaque') caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request, { ignoreSearch: true }).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html', { ignoreSearch: true }) : Response.error()))));
});
