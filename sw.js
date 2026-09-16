const CACHE='everlight-v4-controller';
const CORE=[
  './','./index.html','./manifest.webmanifest',
  './icons/icon-192.svg','./icons/icon-512.svg',
  './js/data.js','./js/systems.js','./js/game.js','./js/controller.js',
  './data/world-events.json','./data/properties.json','./data/loot-tables.json',
  './data/quests.json','./data/factions.json','./data/companions.json','./data/crafting.json','./data/regions.json'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp}).catch(()=>caches.match('./index.html'))))});
