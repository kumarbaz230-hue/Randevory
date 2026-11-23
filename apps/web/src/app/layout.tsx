import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
import { AuthRecoveryListener } from '@/components/auth-recovery-listener';
import { SupportWidgetLazy } from '@/components/support-widget-lazy';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.randevory.com'),
  title: 'RANDEVORY – Profesyonel Randevu ve Hizmet Yönetim Platformu',
  description: 'İşini kolaylaştır, zamanını kazan. Berber, kuaför, oto servis, klinik, özel ders ve tüm randevulu işletmeler için yeni nesil randevu ve yönetim sistemi.',
  applicationName: 'RANDEVORY',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon', sizes: '96x96', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon',
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
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
    <html lang="tr" className={`${plusJakarta.variable} ${instrumentSerif.variable}`}>
      <head>
        <link rel="preconnect" href="https://ysxwuiecybnsgbjbcfoa.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ysxwuiecybnsgbjbcfoa.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'RANDEVORY',
              url: 'https://www.randevory.com',
              logo: 'https://www.randevory.com/icon',
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-500 selection:text-white">
        <AuthRecoveryListener />
        <SupportWidgetLazy />
        <PwaInstallPrompt />
        <CookieConsentBanner />
        {children}
      </body>
    </html>
  );
}
