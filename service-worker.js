const CACHE = "ritmo-v23";
const VERSION = CACHE.match(/v(.+)$/)?.[1] || "desconocida";
const ASSETS = ["./", "./index.html", "./styles.css", "./js/app.js", "./rutina_entrenamiento_bandas.md", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((asset) => new Request(asset, { cache: "reload" })))).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(
	caches.keys()
		.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
		.then(() => self.clients.claim())
));
self.addEventListener("message", (event) => {

	if (event.data?.type === "GET_VERSION") event.source?.postMessage({ type: "APP_VERSION", version: VERSION });
	if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));