'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Vitrin sayfaları için GSAP + ScrollTrigger animasyon kapsayıcısı.
 * clearProps kullanarak elemanların görünmez kalma riskini ortadan kaldırır
 * ve prefers-reduced-motion tercihine tam saygı duyar.
 */
export function HomeAnimations({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const heroItems = gsap.utils.toArray<HTMLElement>('.gsap-hero-item');
      if (heroItems.length > 0) {
        gsap.from(heroItems, {
          y: 20,
          opacity: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });
      }

      const revealGroups = gsap.utils.toArray<HTMLElement>('.gsap-reveal-group');
      revealGroups.forEach((group) => {
        const cards = group.querySelectorAll('.gsap-reveal-card');
        if (cards.length === 0) return;

        gsap.from(cards, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: group,
            start: 'top 86%',
            once: true,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
