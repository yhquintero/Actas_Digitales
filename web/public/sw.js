/* Actas Digitales — Service Worker real (PWA offline).
 *
 * Estrategia:
 *  - Precache del app-shell en install (/, index.html, manifest, iconos).
 *  - Navegaciones: network-first con fallback al shell cacheado (offline abre la UI).
 *  - Estáticos (/assets/*, iconos, manifest, /audio/*): stale-while-revalidate.
 *  - /api/*: SIEMPRE red. Las actas y la telemetría NUNCA se cachean.
 *  - Sin interceptación cross-origin ni POST.
 *
 * Nota de migración: instalaciones con un Service Worker antiguo roto en /sw.js
 * reciben este script al actualizar (mismo scriptURL): el navegador lo sustituye
 * de forma nativa. La purga de emergencia vive en /limpiar-cache.
 */
const CACHE_VERSION = 'actas-v1.6.0';

const PRECACHE = [
  '/',
  '/index.html',
  '/boot.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/actas-digitales-icon.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name.startsWith('actas-') && name !== CACHE_VERSION)
             .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith('/assets/') ||
  url.pathname.startsWith('/audio/') ||
  /\.(png|jpg|jpeg|svg|webp|ico|woff2?|css|js|webmanifest)$/.test(url.pathname);

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request) || await cache.match('/index.html') || await cache.match('/');
    if (cached) return cached;
    return new Response(
      '<!doctype html><html lang="es"><meta charset="utf-8"><title>Sin conexión</title>' +
      '<body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px">' +
      '<div><h1 style="color:#a5b4fc">Sin conexión con el servidor</h1><p>Actas Digitales necesita acceso al servidor para procesar audios.</p><p><button onclick="location.reload()" style="padding:12px 28px;border:0;border-radius:12px;background:#4f46e5;color:#fff;font-size:1rem">Reintentar</button></p></div></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const response = await networkFetch;
  if (response) return response;
  return new Response('', { status: 504 });
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Las actas y la API NUNCA pasan por la caché
  if (url.pathname.startsWith('/api/') || url.pathname === '/api') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
