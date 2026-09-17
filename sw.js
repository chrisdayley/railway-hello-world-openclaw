const CACHE = 'everlight-v22-visual-overhaul';
const CURRENT_BUILD_URL = './index.html?v=21&visual=22';
const CORE = [
  './','./index.html','./manifest.webmanifest','./styles/game-v3.css','./styles/visual-v22.css','./js/game-v4.js','./js/visual-upgrade-v22.js',
  './assets/northford-twilight.jpg','./assets/hero-atlas-concept.png','./assets/hero-player-v2.png',
  './assets/hero-walk-v22.png','./assets/hero-attack-v22.png','./assets/enemies-v22.png',
  './assets/mira-scout.png','./assets/hollow-warden.png',
  './assets/greenwake-vale-v1.jpg','./assets/moonfall-ruins-v1.jpg',
  './data/campaign.json','./data/quests.json','./data/factions.json','./data/companions.json',
  './data/regions.json','./data/loot-tables.json','./data/properties.json','./data/world-events.json','./data/crafting.json',
  './icons/icon-192.svg','./icons/icon-512.svg','./icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => Promise.all(clients.map(client => {
        const url = new URL(client.url);
        return url.searchParams.get('visual') === '22' ? null : client.navigate(CURRENT_BUILD_URL).catch(() => null);
      })))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const request = event.request.mode === 'navigate'
    ? new Request(event.request, { cache: 'no-store' })
    : event.request;
  event.respondWith(fetch(request).then(response => {
    if (response && response.ok && response.type !== 'opaque') caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request, { ignoreSearch: true }).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html', { ignoreSearch: true }) : Response.error()))));
});
