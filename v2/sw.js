const SHELL_CACHE = 'qinggan-route-shell-v6';
const RUNTIME_CACHE = 'qinggan-route-runtime-v6';
const SHELL_ASSETS = [
  './',
  './route-geometry.json',
  '../vendor/maplibre-gl.css',
  '../vendor/maplibre-gl.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL_ASSETS.map(asset => new Request(asset, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('qinggan-route-') && !keep.has(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await Promise.all([
            cache.put(request, response.clone()),
            cache.put('./', response.clone())
          ]);
        }
        return response;
      } catch (error) {
        return (await caches.open(SHELL_CACHE)).match('./', { ignoreSearch: true }) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: false });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    return response;
  })());
});
