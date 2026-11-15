'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Yumuşak kaydırma (Lenis) yalnızca vitrin sayfalarında kullanılır.
 * Destek widget'ı veya herhangi bir modal açıldığında (body overflow: hidden)
 * kaydırmayı otomatik durdurur, böylece hiçbir bileşenle çakışmaz.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const syncScrollLock = () => {
      const isLocked =
        document.body.style.overflow === 'hidden' ||
        document.documentElement.style.overflow === 'hidden';
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    const observer = new MutationObserver(syncScrollLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
