# RANDEVO – Profesyonel Randevu Yönetim Platformu

RANDEVO, berberlerden oto servislere, özel ders merkezlerinden güzellik salonlarına kadar her sektörden randevulu işletmenin operasyonlarını, randevularını, personellerini ve müşterilerini yönetebileceği modern ve ölçeklenebilir SaaS platformudur.

---

## 🌟 Öne Çıkan Özellikler

- **Çok Kiracılı (Multi-Tenant) Mimari:** Her işletmeye özel veri izolasyonu ve profil sayfası (`/isletme-adi`).
- **Müşteri İçin Kolay Randevu:** Hesap açma zorunluluğu olmadan 4 adımda hızlı randevu alma imkanı.
- **Çakışma Önleme Motoru:** Aynı personele aynı saat diliminde randevu çakışmasını hem veritabanı kısıtları (`EXCLUDE USING gist`) hem de backend doğrulama katmanıyla %100 engeller.
- **Esnek Sektör Desteği:** Her sektörün farklı seans süreleri, mola aralıkları ve dinamik fiyatlandırması tanımlanabilir.
- **Gelişmiş Yönetim Paneli:**
  - Günlük / Haftalık Takvim
  - Randevu Durumu Yönetimi (Onay, İptal, Tamamlandı)
  - Personel ve Çalışma Saatleri Planlaması
  - Hizmet Kataloğu & Fiyat Listesi
  - Müşteri Geçmişi ve CRM Takibi
  - Gelir & Ciro Raporlaması
- **Mobil Uyumlu & İleride React Native Expo Entegrasyonuna Hazır.**

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ (Node.js 22 LTS önerilir)
- npm veya pnpm

### Kurulum Adımları

1. Bağımlılıkları yükleyin:
   ```bash
   cd apps/web
   npm install
   ```

2. Ortam değişkenlerini hazırlayın:
   ```bash
   cp .env.example .env.local
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda açın:
   - Ana Sayfa: `http://localhost:3000`
   - İşletme Paneli: `http://localhost:3000/dashboard`
   - Örnek Müşteri Randevu Sayfası: `http://localhost:3000/salon-prestij`

---

## 🗄️ Veritabanı ve Migration

PostgreSQL / Supabase şeması `supabase/migrations/20261107_initial_schema.sql` dosyasında mevcuttur.
Bu dosya:
- Tam RLS (Row Level Security) güvenlik politikalarını
- Randevu çakışmalarını engelleyen `prevent_double_booking` gist kısıtını
- Abonelik paket modellerini içerir.
