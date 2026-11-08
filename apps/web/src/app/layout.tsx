import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthRecoveryListener } from '@/components/auth-recovery-listener';
import { SupportWidgetLazy } from '@/components/support-widget-lazy';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'RANDEVORY – Profesyonel Randevu ve Hizmet Yönetim Platformu',
  description: 'İşini kolaylaştır, zamanını kazan. Berber, kuaför, oto servis, klinik, özel ders ve tüm randevulu işletmeler için yeni nesil randevu ve yönetim sistemi.',
  applicationName: 'RANDEVORY',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  keywords: ['randevu sistemi', 'RANDEVORY', 'online randevu', 'kuaför randevu', 'oto bakım randevu', 'işletme yönetimi'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RANDEVORY',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://ysxwuiecybnsgbjbcfoa.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ysxwuiecybnsgbjbcfoa.supabase.co" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <AuthRecoveryListener />
        <SupportWidgetLazy />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}
