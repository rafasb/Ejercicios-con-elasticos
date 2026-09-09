const CACHE = "ritmo-v25";
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
self.addEventListener("fetch", (event) => {
	const requestUrl = new URL(event.request.url);
	if (requestUrl.pathname.endsWith("/rutina_entrenamiento_bandas.md")) {
		event.respondWith(
			fetch(event.request, { cache: "no-store" })
				.then((response) => caches.open(CACHE).then((cache) => {
					cache.put("./rutina_entrenamiento_bandas.md", response.clone());
					return response;
				}))
				.catch(() => caches.match("./rutina_entrenamiento_bandas.md"))
		);
		return;
	}
	event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});