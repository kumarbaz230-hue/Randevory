import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RANDEVO – Profesyonel Randevu Yönetim Platformu',
  description: 'Berber, kuaför, oto servis, özel ders ve tüm randevulu işletmeler için yeni nesil randevu ve yönetim sistemi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
