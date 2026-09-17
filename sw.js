const CACHE = 'ritme-20260915-workout-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png',
  './workout.css', './workout.js', './assets/workout/hollow.png', './assets/workout/pullup.png',
  './assets/workout/crunch.png', './assets/workout/handstand.png', './assets/workout/taps-front.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ritme-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if(resp.ok){const copy = resp.clone();caches.open(CACHE).then(c => c.put(e.request, copy));}
      return resp;
    }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
