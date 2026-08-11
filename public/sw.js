const VERSION = "nh-v3-" + (new Date().toISOString().slice(0, 10));
const CACHE_NAME = VERSION;
const BASE = self.location.pathname.replace(/\/sw\.js$/, "/");
const PRECACHE = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 导航请求：网络优先，离线回退缓存 index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(BASE + "index.html").then((r) => r || caches.match(BASE))),
    );
    return;
  }
  // 静态：缓存优先
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic" && res.type !== "cors") return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => { try { c.put(req, copy); } catch {} });
        return res;
      }).catch(() => cached);
    }),
  );
});
