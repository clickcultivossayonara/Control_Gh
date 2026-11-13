// Service worker de la pagina Rendimiento: guarda la pagina y lo que necesita para abrir SIN SENAL.
// Solo atiende los archivos de la lista; cualquier otra peticion (otras paginas, Supabase) pasa directo a la red.
// Estrategia: primero la red (para tener siempre la ultima version); si no hay senal, la copia guardada.
const CACHE = "rendimiento-v1";
const PROPIOS = ["rendimiento.html", "logo-sayonara.png", "responsive.css", "responsive.js", "tema-claro.css"];
const EXTERNOS = ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"];

function esPropio(url) {
  return url.origin === self.location.origin && PROPIOS.some((p) => url.pathname.endsWith("/" + p));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => Promise.all([
      ...PROPIOS.map((u) => c.add(u).catch(() => {})),
      ...EXTERNOS.map((u) => fetch(u, { mode: "cors" }).then((r) => (r.ok ? c.put(u, r) : null)).catch(() => {})),
    ])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("rendimiento-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!esPropio(url) && !EXTERNOS.includes(req.url)) return;
  event.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return r;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || Response.error()))
  );
});
