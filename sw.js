const CACHE = 'everlight-v28-roads-remember-r1';
const CURRENT_BUILD_URL = './index.html?v=28';
const CORE = [
  './js/story-v28.js','./styles/story-v28.css',
  './js/merchants-v28.js','./styles/merchants-v28.css','./js/skills-v28.js','./styles/skills-v28.css',
  './assets/interior-furniture-v27.png',
  './js/progression-v27.js','./js/interiors-v27.js','./js/minimap-v27.js','./styles/journey-v27.css',
  './','./index.html','./manifest.webmanifest','./styles/game-v3.css','./styles/visual-v22.css','./js/visual-upgrade-v22.js','./js/world-atlas-v22.js','./js/game-v4.js','./js/exploration-v24.js','./js/actors-v24.js',
  './js/economy-v26.js','./styles/economy-v26.css','./js/camera-v25.js','./js/equipment-v25.js','./styles/equipment-v25.css',
  './assets/northford-twilight.jpg','./assets/hero-atlas-concept.png','./assets/hero-player-v2.png','./assets/hero-walk-v22.png','./assets/hero-attack-v22.png','./assets/enemies-v22.png',
  './assets/mira-scout.png','./assets/hollow-warden.png',
  './assets/greenwake-vale-v1.jpg','./assets/moonfall-ruins-v1.jpg',
  './assets/interior-smithy-v1.jpg','./assets/interior-apothecary-v1.jpg','./assets/interior-inn-v1.jpg',
  './assets/interior-guildhall-v1.jpg','./assets/interior-stable-v1.jpg',
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
        return url.searchParams.get('v') === '28' ? null : client.navigate(CURRENT_BUILD_URL).catch(() => null);
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
