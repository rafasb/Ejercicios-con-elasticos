const CACHE = "ritmo-v38";
const VERSION = CACHE.match(/v(.+)$/)?.[1] || "desconocida";
const ASSETS = ["./", "./index.html", "./offline.html", "./styles.css", "./js/app.js", "./js/constants.js", "./js/utils.js", "./js/state.js", "./js/render.js", "./rutina_entrenamiento_bandas.md", "./rutina.json", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./assets/Tension.m4a", "./assets/Pausa.m4a", "./assets/Distension.m4a", "./assets/Descanso.m4a", "./assets/Preparacion.m4a"];
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
	if (requestUrl.pathname.endsWith("/rutina_entrenamiento_bandas.md") || requestUrl.pathname.endsWith("/rutina.json")) {
		const cacheKey = requestUrl.pathname.endsWith(".json") ? "./rutina.json" : "./rutina_entrenamiento_bandas.md";
		event.respondWith(
			fetch(event.request, { cache: "no-store" })
				.then((response) => caches.open(CACHE).then((cache) => {
					cache.put(cacheKey, response.clone());
					return response;
				}))
				.catch(() => caches.match(cacheKey))
		);
		return;
	}
	event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).catch((error) => {
		if (event.request.mode === "navigate") return caches.match("./offline.html");
		throw error;
	})));
});