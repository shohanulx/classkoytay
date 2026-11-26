/* classkoytay service worker — offline shell + background reminders */
const CACHE = 'classkoytay-v3';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/syllabus.js', 'js/presets.js', 'js/faculty.js', 'js/bridge.js', 'img/ruet-logo.png', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // network-first for app files so updates land quickly, cache fallback offline
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
  } else if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
  }
});

function readQueue() {
  return new Promise((resolve) => {
    const r = indexedDB.open('classkoytay', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => { const db = r.result; const g = db.transaction('kv').objectStore('kv').get('queue'); g.onsuccess = () => { resolve({ db, q: g.result }); }; g.onerror = () => resolve({ db, q: null }); };
    r.onerror = () => resolve({ db: null, q: null });
  });
}
async function checkDue() {
  const { db, q } = await readQueue();
  if (!q || !q.enabled) return;
  const now = Date.now();
  q.notified = q.notified || {};
  for (const a of q.alerts || []) {
    if (a.at <= now && a.at > now - 30 * 60000 && !q.notified[a.id]) {
      q.notified[a.id] = now;
      await self.registration.showNotification(a.title, { body: a.body, tag: a.tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './#today' } });
    }
  }
  if (db) db.transaction('kv', 'readwrite').objectStore('kv').put(q, 'queue');
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'ck-check') e.waitUntil(checkDue()); });
self.addEventListener('push', (e) => { e.waitUntil(checkDue()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => { for (const c of cs) if ('focus' in c) return c.focus(); return self.clients.openWindow(e.notification.data?.url || './'); }));
});
