const CACHE = "ritmo-v22";
const ASSETS = ["./", "./index.html", "./styles.css?v=22", "./app.js?v=22", "./rutina_entrenamiento_bandas.md?v=16", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((asset) => new Request(asset, { cache: "reload" })))).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("message", (event) => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));