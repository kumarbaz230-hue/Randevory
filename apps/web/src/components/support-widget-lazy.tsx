'use client';

import dynamic from 'next/dynamic';

// Canlı destek penceresi büyük bir bileşen: sayfa açıldıktan sonra arka planda yüklenir,
// böylece ilk açılış (özellikle telefonda) çok daha hızlı olur.
const SupportFloatingWidget = dynamic(
  () => import('@/components/support-floating-widget').then((m) => m.SupportFloatingWidget),
  { ssr: false, loading: () => null }
);

export function SupportWidgetLazy() {
  return <SupportFloatingWidget />;
}
