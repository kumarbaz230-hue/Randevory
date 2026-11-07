import type { Metadata } from 'next';
import './globals.css';
import { AuthRecoveryListener } from '@/components/auth-recovery-listener';
import { SupportFloatingWidget } from '@/components/support-floating-widget';

export const metadata: Metadata = {
  title: 'RANDEVORY – Profesyonel Randevu ve Hizmet Yönetim Platformu',
  description: 'İşini kolaylaştır, zamanını kazan. Berber, kuaför, oto servis, klinik, özel ders ve tüm randevulu işletmeler için yeni nesil randevu ve yönetim sistemi.',
  applicationName: 'RANDEVORY',
  keywords: ['randevu sistemi', 'RANDEVORY', 'online randevu', 'kuaför randevu', 'oto bakım randevu', 'işletme yönetimi'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <AuthRecoveryListener />
        <SupportFloatingWidget />
        {children}
      </body>
    </html>
  );
}
