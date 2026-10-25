// Service worker: cache shell aplikasi agar bisa dipakai offline.
const CACHE = 'pantau-tumbuh-v33';
const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'logofix.png',
  'cover.jpeg',
  'img/asi.png',
  'img/mpasi.png',
  'img/imunisasi.png',
  'img/pantau.png',
  'img/air.png',
  'img/hamil.png',
  'img/tanda/tinggi.svg',
  'img/tanda/berat.svg',
  'img/tanda/wajah.svg',
  'img/tanda/sakit.svg',
  'img/tanda/belajar.svg',
  'data/who-lms.json',
  'js/config.js',
  'js/content/articles.js',
  'js/content/diet.js',
  'js/core/data.js',
  'js/core/storage.js',
  'js/core/zscore.js',
  'js/i18n/en.js',
  'js/i18n/id.js',
  'js/i18n/index.js',
  'js/main.js',
  'js/ui/chart.js',
  'js/ui/consult.js',
  'js/ui/diet.js',
  'js/ui/dom.js',
  'js/ui/edu.js',
  'js/ui/form.js',
  'js/ui/format.js',
  'js/ui/history.js',
  'js/ui/measure.js',
  'js/ui/result.js',
  'js/ui/router.js',
  'js/ui/state.js',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/results.css',
  'css/pages.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // data/who-lms.json mungkin belum ada; jangan gagalkan instalasi karena satu file.
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// Stale-while-revalidate untuk permintaan GET satu origin.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
