const CACHE = 'workout-ffe77cfb1859af01';
const ASSETS = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./app.css", "./workout.js", "./workout.css", "./icons/icon.svg", "./assets/workout/hollow.png", "./assets/workout/pullup.png", "./assets/workout/crunch.png", "./assets/workout/handstand.png", "./assets/workout/taps-front.png", "./assets/workout/plank.png", "./assets/workout/side-plank.png", "./assets/workout/bridge.png", "./assets/workout/bird-dog-pose.png", "./assets/workout/padel-adductor.png", "./assets/workout/padel-ankle.png", "./assets/workout/padel-bridge.png", "./assets/workout/padel-calf-raise.png", "./assets/workout/padel-calf-stretch.png", "./assets/workout/padel-chest-stretch.png", "./assets/workout/padel-hip-9090.png", "./assets/workout/padel-hip-flexor.png", "./assets/workout/padel-lat-stretch.png", "./assets/workout/padel-open-book.png", "./assets/workout/padel-push-up.png", "./assets/workout/padel-reverse-lunge.png", "./assets/workout/padel-side-lunge.png", "./assets/workout/padel-skater.png", "./assets/workout/padel-squat.png", "./assets/workout/padel-taps.png"];
const BASE = new URL('./', self.location.href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('workout-') && key !== CACHE).map(key => caches.delete(key))
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
