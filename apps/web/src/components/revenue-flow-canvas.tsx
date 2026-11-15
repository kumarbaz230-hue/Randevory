'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DataPoint {
  day: string;
  revenue: number;
  appointments: number;
}

const WEEKLY_DATA: DataPoint[] = [
  { day: 'Pzt', revenue: 5400, appointments: 11 },
  { day: 'Sal', revenue: 6900, appointments: 14 },
  { day: 'Çar', revenue: 6200, appointments: 13 },
  { day: 'Per', revenue: 8800, appointments: 17 },
  { day: 'Cum', revenue: 11400, appointments: 22 },
  { day: 'Cmt', revenue: 13800, appointments: 26 },
  { day: 'Paz', revenue: 9450, appointments: 18 },
];

/**
 * Koyu cam ürün vitrini için etkileşimli HTML5 Canvas haftalık ciro ve randevu grafiği.
 */
export function RevenueFlowCanvas({ dark = true }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderChart = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) return;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, width, height);

      const padX = 18;
      const padTop = 20;
      const padBottom = 26;
      const chartW = width - padX * 2;
      const chartH = height - padTop - padBottom;
      const maxVal = 15000;

      ctx.strokeStyle = dark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = padTop + (chartH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(width - padX, y);
        ctx.stroke();
      }

      const coords = WEEKLY_DATA.map((d, i) => ({
        x: padX + (chartW / (WEEKLY_DATA.length - 1)) * i,
        y: padTop + chartH - (d.revenue / maxVal) * chartH,
      }));

      const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
      areaGrad.addColorStop(0, dark ? 'rgba(56, 189, 248, 0.34)' : 'rgba(37, 99, 235, 0.26)');
      areaGrad.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

      ctx.beginPath();
      ctx.moveTo(coords[0].x, padTop + chartH);
      ctx.lineTo(coords[0].x, coords[0].y);
      for (let i = 0; i < coords.length - 1; i++) {
        const xc = (coords[i].x + coords[i + 1].x) / 2;
        const yc = (coords[i].y + coords[i + 1].y) / 2;
        ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
      }
      ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
      ctx.lineTo(coords[coords.length - 1].x, padTop + chartH);
      ctx.closePath();
      ctx.fillStyle = areaGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(coords[0].x, coords[0].y);
      for (let i = 0; i < coords.length - 1; i++) {
        const xc = (coords[i].x + coords[i + 1].x) / 2;
        const yc = (coords[i].y + coords[i + 1].y) / 2;
        ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
      }
      ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
      ctx.strokeStyle = dark ? '#38bdf8' : '#2563eb';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      coords.forEach((pt, idx) => {
        const isActive = idx === activeIndex;
        if (isActive) {
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(pt.x, padTop);
          ctx.lineTo(pt.x, padTop + chartH);
          ctx.strokeStyle = dark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(37, 99, 235, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isActive ? 5.5 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? (dark ? '#38bdf8' : '#2563eb') : dark ? '#0f172a' : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = dark ? '#38bdf8' : '#2563eb';
        ctx.stroke();

        ctx.fillStyle = isActive ? (dark ? '#f8fafc' : '#0f172a') : dark ? '#94a3b8' : '#64748b';
        ctx.font = `${isActive ? '700' : '500'} 10px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(WEEKLY_DATA[idx].day, pt.x, height - 8);
      });
    };

    renderChart();
    const ro = new ResizeObserver(renderChart);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [activeIndex, dark]);

  const handlePointer = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const idx = Math.round((relX / rect.width) * (WEEKLY_DATA.length - 1));
    setActiveIndex(Math.max(0, Math.min(WEEKLY_DATA.length - 1, idx)));
  };

  const current = WEEKLY_DATA[activeIndex];

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col justify-between ${
        dark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <div className={`text-xs font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
            Haftalık Ciro &amp; Randevu Grafiği
          </div>
          <div className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Günlerin üzerine dokunarak inceleyin
          </div>
        </div>
        <div
          className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
            dark
              ? 'bg-sky-500/15 border-sky-400/30 text-sky-300'
              : 'bg-blue-50 border-blue-200 text-brand-700'
          }`}
        >
          {current.day}: {current.revenue.toLocaleString('tr-TR')} ₺ • {current.appointments} Randevu
        </div>
      </div>

      <div className="relative h-36 sm:h-40 w-full">
        <canvas
          ref={canvasRef}
          onMouseMove={(e) => handlePointer(e.clientX)}
          onTouchStart={(e) => {
            if (e.touches[0]) handlePointer(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointer(e.touches[0].clientX);
          }}
          className="w-full h-full cursor-crosshair touch-pan-y"
        />
      </div>
    </div>
  );
}
