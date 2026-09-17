const CACHE = 'ritme-20260917154859';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png',
  './workout.css', './workout.js', './assets/workout/hollow.png', './assets/workout/pullup.png',
  './assets/workout/crunch.png', './assets/workout/handstand.png', './assets/workout/taps-front.png'];

// Code (pagina + css/js) halen we altijd eerst van het netwerk, zodat updates
// meteen zichtbaar zijn. Plaatjes en iconen blijven cache-first (snel + offline).
const FRESH = /\/(index\.html|workout\.js|workout\.css|manifest\.json)$|\/ritme\/$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ritme-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function store(req, resp){
  if(resp && resp.ok){const copy = resp.clone();caches.open(CACHE).then(c => c.put(req, copy));}
  return resp;
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate' || FRESH.test(url.pathname)) {
    e.respondWith(
      fetch(e.request).then(resp => store(e.request, resp))
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => store(e.request, resp))
      .catch(() => Response.error()))
  );
});
