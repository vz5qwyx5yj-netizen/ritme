const CACHE = 'ritme-split-v1';
const ASSETS = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./habits.js", "./habits.css"];
const BASE = new URL('./', self.location.href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('ritme-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  // The tracker must never return its shell or assets for the separate Workout app.
  if (url.pathname.startsWith(BASE.pathname + 'Workout/')) return;
  const fresh = event.request.mode === 'navigate' || /\.(?:html|js|css|json)$/.test(url.pathname);
  const network = async () => {
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  };
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (!fresh) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
    }
    try { return await network(); }
    catch (_) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return (await cache.match(new URL('index.html', BASE))) || Response.error();
      return Response.error();
    }
  })());
});
