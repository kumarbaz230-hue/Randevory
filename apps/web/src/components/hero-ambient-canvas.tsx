'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  hue: 'blue' | 'cyan' | 'indigo';
}

/**
 * Koyu Hero arkası için akışkan HTML5 Canvas parçacık ve bağlantı ağı.
 * Fare hareketine yumuşak tepki verir, mobilde parçacık sayısını azaltır
 * ve prefers-reduced-motion açıkken çalışmaz.
 */
export function HeroAmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999 };
    let particles: Particle[] = [];

    const colorMap: Record<Particle['hue'], string> = {
      blue: '96, 165, 250',
      cyan: '34, 211, 238',
      indigo: '129, 140, 248',
    };

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const hues: Particle['hue'][] = ['blue', 'cyan', 'indigo'];
      const count = width < 640 ? 28 : 56;
      particles = Array.from({ length: count }, (_, idx) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: 1.4 + Math.random() * 2,
        alpha: 0.35 + Math.random() * 0.45,
        hue: hues[idx % hues.length],
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dxPtr = p.x - pointer.x;
        const dyPtr = p.y - pointer.y;
        const distPtr = Math.hypot(dxPtr, dyPtr);
        if (distPtr < 150 && distPtr > 0) {
          const force = (150 - distPtr) / 150;
          p.x += (dxPtr / distPtr) * force * 0.85;
          p.y += (dyPtr / distPtr) * force * 0.85;
        }

        const rgb = colorMap[p.hue];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 145) {
            const lineAlpha = (1 - dist / 145) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };

    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    init();
    draw();

    const resizeObserver = new ResizeObserver(init);
    resizeObserver.observe(canvas);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseleave', onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}
