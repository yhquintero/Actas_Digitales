// Boot: aplicar el tema antes del primer pintado (evita FOUC) y registrar
// el Service Worker real de la PWA (/sw.js). Si el contexto no es seguro
// (http fuera de localhost/LAN), el navegador rechaza el registro y la app
// funciona igualmente como Web normal.
(function () {
  try {
    var saved = localStorage.getItem('actas_theme');
    if (saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) { /* tema por defecto: claro */ }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {
        // PWA opcional: sin registro, el sitio sigue funcionando como Web.
      });
    });
  }
})();
