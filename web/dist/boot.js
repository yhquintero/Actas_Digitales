// Boot inline-free: aplicar el tema antes del primer pintado (evita FOUC) y
// purgar cualquier Service Worker residual (CSP: script-src 'self').
(function () {
  try {
    var saved = localStorage.getItem('actas_theme');
    if (saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) { /* tema por defecto: claro */ }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (var i = 0; i < registrations.length; i++) {
        registrations[i].unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then(function (names) {
      for (var i = 0; i < names.length; i++) {
        caches.delete(names[i]);
      }
    });
  }
})();
