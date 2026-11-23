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
 * Haftalık ciro ve randevu yoğunluğu grafiği.
 * Sıcak nötr ızgara, tek kobalt vurgu ve tabular sayı biçimiyle çizilir.
 */
export function RevenueFlowCanvas() {
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

      const padX = 16;
      const padTop = 16;
      const padBottom = 24;
      const chartW = width - padX * 2;
      const chartH = height - padTop - padBottom;
      const maxVal = 15000;

      ctx.strokeStyle = 'rgba(28, 25, 23, 0.08)';
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
      areaGrad.addColorStop(0, 'rgba(29, 78, 216, 0.14)');
      areaGrad.addColorStop(1, 'rgba(29, 78, 216, 0.0)');

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
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      ctx.stroke();

      coords.forEach((pt, idx) => {
        const isActive = idx === activeIndex;
        if (isActive) {
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.moveTo(pt.x, padTop);
          ctx.lineTo(pt.x, padTop + chartH);
          ctx.strokeStyle = 'rgba(29, 78, 216, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isActive ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#1d4ed8' : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.75;
        ctx.strokeStyle = '#1d4ed8';
        ctx.stroke();

        ctx.fillStyle = isActive ? '#1c1917' : '#78716c';
        ctx.font = `${isActive ? '600' : '400'} 11px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(WEEKLY_DATA[idx].day, pt.x, height - 6);
      });
    };

    renderChart();
    const ro = new ResizeObserver(renderChart);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [activeIndex]);

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
    <div className="rounded-xl border border-stone-900/10 bg-[#fafaf8] p-4 flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div>
          <div className="text-xs font-medium text-stone-900">Haftalık ciro akışı</div>
          <div className="text-[11px] text-stone-500">Gün bazlı randevu geliri</div>
        </div>
        <div className="text-xs font-mono tabular-nums text-stone-900">
          <span className="text-stone-500 mr-1.5">{current.day}</span>
          <span className="font-semibold">{current.revenue.toLocaleString('tr-TR')} ₺</span>
          <span className="text-stone-400 mx-1.5">·</span>
          <span className="text-stone-600">{current.appointments} randevu</span>
        </div>
      </div>

      <div className="relative h-36 w-full">
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
