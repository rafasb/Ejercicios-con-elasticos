const CACHE = "ritmo-v8";
const ASSETS = ["./", "./index.html", "./styles.css?v=8", "./app.js?v=8", "./rutina_entrenamiento_bandas.md", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((asset) => new Request(asset, { cache: "reload" })))).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));