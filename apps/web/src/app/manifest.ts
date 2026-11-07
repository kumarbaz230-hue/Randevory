import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RANDEVORY – Profesyonel Randevu Yönetim Platformu',
    short_name: 'RANDEVORY',
    description: 'İşini kolaylaştır, zamanını kazan. Çok sektörlü randevu, personel ve işletme yönetim platformu.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  };
}
