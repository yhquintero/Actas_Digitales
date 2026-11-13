import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SIZE = 58;
const STROKE = 3.5;
const RADIUS = (SIZE - STROKE) / 2 - 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SHOW_AFTER_PX = 240;

/**
 * Botón flotante circular «Volver arriba».
 *
 * · Permanece anclado a la esquina inferior derecha y acompaña el scroll en ambos sentidos.
 * · Muestra el progreso de lectura como anillo alrededor de la flecha única.
 * · Aparece tras 240 px de scroll y se oculta suavemente al llegar al tope.
 * · Respeta `prefers-reduced-motion` (salto instantáneo en ese caso).
 */
export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const doc = document.documentElement;
      const maxScrollable = Math.max(0, doc.scrollHeight - doc.clientHeight);
      const current = window.scrollY || doc.scrollTop || 0;
      setProgress(maxScrollable > 0 ? Math.min(1, Math.max(0, current / maxScrollable)) : 0);
      setVisible(current > SHOW_AFTER_PX);
      ticking = false;
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  const scrollToTop = () => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Volver arriba"
      title="Volver arriba"
      className={[
        'fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700',
        'text-white shadow-2xl shadow-indigo-900/40 ring-1 ring-white/25',
        'transition-all duration-300 ease-out outline-none',
        'hover:scale-110 hover:shadow-violet-900/50',
        'focus-visible:ring-4 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'active:scale-95',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none',
      ].join(' ')}
      style={{ width: SIZE, height: SIZE }}
    >
      {/* Anillo de progreso de lectura */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>
      {/* Única flecha apuntando hacia arriba */}
      <ArrowUp className="relative h-6 w-6" strokeWidth={2.6} aria-hidden="true" />
    </button>
  );
};
