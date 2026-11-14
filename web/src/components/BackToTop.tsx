import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Botón flotante «Volver arriba»: aparece tras hacer scroll (> 480 px) y
 * devuelve al inicio con desplazamiento suave. No se muestra si el usuario
 * prefiere movimiento reducido (respeta prefers-reduced-motion).
 */
export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })}
      aria-label="Volver arriba"
      title="Volver arriba"
      className="fixed bottom-6 right-5 z-50 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-indigo-950/90 text-white text-xs font-bold shadow-lg shadow-slate-900/20 border border-slate-700/60 backdrop-blur hover:bg-slate-800 dark:hover:bg-indigo-900 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <ArrowUp className="w-4 h-4" />
      <span className="hidden sm:inline">Volver arriba</span>
    </button>
  );
};
