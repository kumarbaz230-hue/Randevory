'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  ThumbsUp,
  Heart,
  MessageSquarePlus,
  CheckCircle2,
  Filter,
  ChevronDown,
  Award,
  Sparkles,
  X,
} from 'lucide-react';

export interface SiteReview {
  id: string;
  author: string;
  role: string;
  city: string;
  rating: 5 | 4 | 3 | 2 | 1;
  comment: string;
  dateLabel: string;
  helpfulCount: number;
  verified: boolean;
}

const INITIAL_REVIEWS: SiteReview[] = [
  { id: 'r-1', author: 'Burak Çetin', role: 'Erkek Kuaförü Sahibi', city: 'İstanbul', rating: 5, comment: 'Dükkanda telefon trafiği yüzünden makası elimden bırakamıyordum. Şimdi Instagram biyografime linki koydum, müşteriler kendi saatini seçip geliyor. Gerçekten büyük rahatlık.', dateLabel: '2 gün önce', helpfulCount: 34, verified: true },
  { id: 'r-2', author: 'Elif Yılmaz', role: 'Güzellik Merkezi Yöneticisi', city: 'Ankara', rating: 5, comment: '4 uzman çalışıyoruz, eskiden defterde sürekli saatler çakışıyordu. RANDEVORY ile çakışma olayı tamamen bitti. WhatsApp onay butonu da aşırı pratik.', dateLabel: '3 gün önce', helpfulCount: 29, verified: true },
  { id: 'r-3', author: 'Serkan Demirtaş', role: 'Oto Detailing & Yıkama', city: 'İzmir', rating: 4, comment: 'Seramik kaplama ve iç dış yıkama randevularımızı buradan yönetiyoruz. Arayüz çok sade, sadece koyu tema seçeneği de gelse 10 numara olur.', dateLabel: '3 gün önce', helpfulCount: 18, verified: true },
  { id: 'r-4', author: 'Gizem Kaya', role: 'Randevu Alan Müşteri', city: 'Bursa', rating: 5, comment: 'Kuaförümü aramaya çekiniyordum müsait mi değil mi diye. QR kodu okutup 20 saniyede boş saati seçtim, iptal etme seçeneği olması da çok güven verici.', dateLabel: '4 gün önce', helpfulCount: 25, verified: true },
  { id: 'r-5', author: 'Oğuzhan Aydın', role: 'Berber Salonu İşletmecisi', city: 'Antalya', rating: 5, comment: 'Vitrin afişi indirme özelliğini kullanıp dükkanın camına yapıştırdım. Akşam dükkan kapalıyken bile müşteriler camdan QR okutup ertesi güne randevu alıyor.', dateLabel: '5 gün önce', helpfulCount: 41, verified: true },
  { id: 'r-6', author: 'Merve Şahin', role: 'Nail Art & Protez Tırnak', city: 'İstanbul', rating: 4, comment: 'Müşteri notları ve geçmiş harcama takibi (CRM) çok işime yarıyor. Hangi müşteriye hangi işlemi yaptığımı unutmuyorum.', dateLabel: '6 gün önce', helpfulCount: 15, verified: true },
  { id: 'r-7', author: 'Kadir Polat', role: 'Erkek Bakım Stüdyosu', city: 'Adana', rating: 3, comment: 'Sistem genel olarak işimizi gördü ama ilk gün çalışma saatlerini ve personelleri ayarlarken alışmam biraz vakit aldı. Destek kısmı yardımcı oldu, şu an kullanıyoruz.', dateLabel: '1 hafta önce', helpfulCount: 11, verified: true },
  { id: 'r-8', author: 'Zeynep Kılıç', role: 'Klinik Pilates Eğitmeni', city: 'İzmir', rating: 5, comment: 'Birebir ders saatlerimi öğrencilerimle paylaşmak için kullanıyorum. Canlı mesajlaşma kısmından direkt bana soru sorabilmeleri harika olmuş.', dateLabel: '1 hafta önce', helpfulCount: 22, verified: true },
  { id: 'r-9', author: 'Tolga Arslan', role: 'Oto Ekspertiz & Bakım', city: 'Konya', rating: 5, comment: 'Fiyat performans olarak piyasadaki yabancı yazılımlardan kat kat iyi. Türkçe olması ve kurulumunun 5 dakika sürmesi tercih sebebimiz oldu.', dateLabel: '1 hafta önce', helpfulCount: 19, verified: true },
  { id: 'r-10', author: 'Esra Doğan', role: 'Cilt Bakım Uzmanı', city: 'Gaziantep', rating: 4, comment: 'Müşterilerin randevu alırken uygulama indirmek zorunda olmaması en büyük avantajı. Direkt linke tıklayıp alıyorlar.', dateLabel: '1 hafta önce', helpfulCount: 16, verified: true },
  { id: 'r-11', author: 'Hakan Özkan', role: 'Kuaför & Saç Tasarım', city: 'Kocaeli', rating: 5, comment: 'Cuma ve Cumartesi yoğunluğunda bizi ipten aldı diyebilirim. Kimin hangi saatte geleceği dakika dakika belli.', dateLabel: '2 hafta önce', helpfulCount: 27, verified: true },
  { id: 'r-12', author: 'Büşra Çelik', role: 'Diyetisyen', city: 'Ankara', rating: 5, comment: 'Danışanlarımın kontrol seanslarını RANDEVORY üzerinden planlıyorum. Hem kurumsal duruyor hem de takvimim hiç karışmıyor.', dateLabel: '2 hafta önce', helpfulCount: 14, verified: true },
  { id: 'r-13', author: 'Onur Koç', role: 'Telefon & Tablet Teknik Servis', city: 'İstanbul', rating: 3, comment: 'Randevu sistemi hızlı çalışıyor fakat raporlar kısmında haftalık Excel çıktısı alma butonu da eklense muhasebe için daha kolay olurdu.', dateLabel: '2 hafta önce', helpfulCount: 9, verified: true },
  { id: 'r-14', author: 'Seda Yıldırım', role: 'Lazer & Epilasyon Merkezi', city: 'Mersin', rating: 5, comment: 'Profesyonel paketi kullanıyoruz, 6 personelimizin tüm seansları tıkır tıkır işliyor. Müşteri memnuniyetimiz ciddi oranda arttı.', dateLabel: '2 hafta önce', helpfulCount: 31, verified: true },
  { id: 'r-15', author: 'Emre Aksoy', role: 'Randevu Alan Müşteri', city: 'Eskişehir', rating: 5, comment: 'Berberim bu sisteme geçtiğinden beri sıra bekleme derdim kalmadı. Saat 15:00 randevumu alıyorum, 15:00’te koltuğa oturuyorum.', dateLabel: '2 hafta önce', helpfulCount: 20, verified: true },
  { id: 'r-16', author: 'Sinem Kurt', role: 'Kaş & Kirpik Tasarım Stüdyosu', city: 'İstanbul', rating: 4, comment: 'Çok temiz ve hızlı bir site. Müşterilerim bazen randevu saatini unutuyordu, WhatsApp hatırlatma mesajını tek tuşla göndermek çok pratik.', dateLabel: '3 hafta önce', helpfulCount: 17, verified: true },
  { id: 'r-17', author: 'Volkan Güler', role: 'Erkek Kuaförü', city: 'Kayseri', rating: 5, comment: 'Ücretsiz paketle denemeye başladım, memnun kalınca Standart pakete geçtim. Her kuruşunu hak eden yerli bir sistem.', dateLabel: '3 hafta önce', helpfulCount: 23, verified: true },
  { id: 'r-18', author: 'Derya Acar', role: 'Psikolojik Danışman', city: 'İzmir', rating: 5, comment: 'KVKK metinlerinin ve sorumluluk beyanının hazır olarak randevu ekranında yer alması hukuki açıdan içimi çok rahatlattı.', dateLabel: '3 hafta önce', helpfulCount: 28, verified: true },
  { id: 'r-19', author: 'Murat Tekin', role: 'Oto Kuaför İşletmecisi', city: 'Samsun', rating: 4, comment: 'Telefondan yönetim panelini kullanmak çok rahat. Bilgisayar açmaya bile gerek kalmadan tüm günün randevularını kontrol ediyorum.', dateLabel: '3 hafta önce', helpfulCount: 12, verified: true },
  { id: 'r-20', author: 'Cansu Erdem', role: 'Makyaj & Gelin Başı Stüdyosu', city: 'Bursa', rating: 5, comment: 'Özellikle düğün sezonunda saatlerimiz çok kritik oluyor. Hizmet sürelerini 45 dk, 60 dk diye ayrı ayrı ayarlayabilmek harika.', dateLabel: '3 hafta önce', helpfulCount: 19, verified: true },
  { id: 'r-21', author: 'Cihan Yavuz', role: 'Berber Dükkanı Sahibi', city: 'Denizli', rating: 3, comment: 'Genç müşterilerimiz linkten hemen randevu alıyor ama yaşlı müşterilerimiz yine telefonla arıyor, onları da biz manuel takvime ekliyoruz. İş görüyor.', dateLabel: '1 ay önce', helpfulCount: 13, verified: true },
  { id: 'r-22', author: 'Tuğba Öztürk', role: 'Güzellik & Bakım Salonu', city: 'Antalya', rating: 5, comment: 'Müşterilerin kendi randevusunu telefon numarasıyla sorgulayıp iptal edebilmesi boş koltuk kalmasını engelledi. İptal edilen saate hemen başkası randevu alıyor!', dateLabel: '1 ay önce', helpfulCount: 36, verified: true },
  { id: 'r-23', author: 'Sinan Bulut', role: 'Özel Matematik Öğretmeni', city: 'Ankara', rating: 5, comment: 'Velilerle saat ayarlamak için saatlerce mesajlaşıyorduk. Şimdi linkimi atıyorum, müsait saatimi görüp kendileri seçiyor.', dateLabel: '1 ay önce', helpfulCount: 15, verified: true },
  { id: 'r-24', author: 'Yasemin Çakır', role: 'Veteriner Hekim', city: 'Muğla', rating: 4, comment: 'Kliniğimizde aşı ve kontrol muayeneleri için kullanıyoruz. Acil vakalar dışında rutin randevuları çok güzel düzene soktu.', dateLabel: '1 ay önce', helpfulCount: 14, verified: true },
  { id: 'r-25', author: 'Barış Korkmaz', role: 'Erkek Kuaförü', city: 'Trabzon', rating: 5, comment: 'Çırak bile telefondan iki saniyede randevu onaylayabiliyor, kullanımı o kadar basit. Elinize sağlık.', dateLabel: '1 ay önce', helpfulCount: 21, verified: true },
  { id: 'r-26', author: 'İrem Bozkurt', role: 'Randevu Alan Müşteri', city: 'İstanbul', rating: 5, comment: 'Cilt bakımı için randevu aldım, uzman seçimi yapabilmek ve fiyatları önceden şeffafça görebilmek çok güzel.', dateLabel: '1 ay önce', helpfulCount: 18, verified: true },
  { id: 'r-27', author: 'Fatih Şen', role: 'Dövme (Tattoo) Stüdyosu', city: 'İzmir', rating: 5, comment: 'Stüdyomuzda 3 sanatçı çalışıyoruz. Herkesin kendi rengiyle takvimde görünmesi karmaşayı tamamen bitirdi.', dateLabel: '1 ay önce', helpfulCount: 16, verified: true },
  { id: 'r-28', author: 'Gökhan Avcı', role: 'Lastik & Jant Servisi', city: 'Sakarya', rating: 4, comment: 'Kışlık-yazlık lastik değişim dönemlerinde kapıda kuyruk oluyordu. Randevulu sisteme geçince müşteriler de biz de rahat ettik.', dateLabel: '1 ay önce', helpfulCount: 11, verified: true },
  { id: 'r-29', author: 'Pınar Gül', role: 'Kuaför & Renklendirme Uzmanı', city: 'İstanbul', rating: 5, comment: 'Ombre ve röfle gibi uzun süren işlemleri 120 dakika, saç kesimini 30 dakika olarak tanımladım; sistem boşlukları ona göre otomatik hesaplıyor.', dateLabel: '1 ay önce', helpfulCount: 24, verified: true },
  { id: 'r-30', author: 'Uğur Taş', role: 'Randevu Alan Müşteri', city: 'Tekirdağ', rating: 3, comment: 'Randevu almak çok kolay oldu ama ilk başta hangi uzmanı seçeceğime karar veremedim, neyse ki Fark Etmez seçeneği varmış.', dateLabel: '1 ay önce', helpfulCount: 8, verified: true },
  { id: 'r-31', author: 'Melike Sarı', role: 'Estetisyen', city: 'Bursa', rating: 5, comment: 'Ciro raporları sayesinde ay sonunda hangi hizmetten ne kadar kazandığımızı tek ekranda görüyoruz. Defter kitap tutmaya son verdik.', dateLabel: '1 ay önce', helpfulCount: 20, verified: true },
  { id: 'r-32', author: 'Kemal Duman', role: 'Berber Salonu', city: 'Balıkesir', rating: 5, comment: 'Müşterilerle site içinden canlı mesajlaşma özelliği harika olmuş. WhatsApp numaramı herkese vermeden siteden yazışabiliyorum.', dateLabel: '1 ay önce', helpfulCount: 26, verified: true },
  { id: 'r-33', author: 'Ayşegül Ünal', role: 'Fizyoterapi & Danışmanlık', city: 'Ankara', rating: 4, comment: 'Seans aralarındaki mola sürelerini dikkate alması çok başarılı. Yoğun günlerde nefes almamızı sağlıyor.', dateLabel: '1 ay önce', helpfulCount: 13, verified: true },
  { id: 'r-34', author: 'Yusuf Erdoğan', role: 'Erkek Kuaförü', city: 'Aydın', rating: 5, comment: 'Google Haritalar profilimize randevu linkimizi ekledik, haritadan bizi bulan müşteriler direkt randevu alıp geliyor.', dateLabel: '1 ay önce', helpfulCount: 22, verified: true },
  { id: 'r-35', author: 'Ebru Karaca', role: 'Güzellik Salonu Sahibi', city: 'İstanbul', rating: 5, comment: 'Daha önce çok pahalı bir program kullanıyorduk ve yarısı İngilizceydi. RANDEVORY hem çok daha hızlı hem de esnafın dilinden anlıyor.', dateLabel: '1 ay önce', helpfulCount: 30, verified: true },
  { id: 'r-36', author: 'Mustafa Aktaş', role: 'Oto Ekspertiz', city: 'Manisa', rating: 4, comment: 'Ekspertiz randevularında saat çakışması sıfıra indi. Müşteri memnuniyeti açısından çok faydalı.', dateLabel: '1 ay önce', helpfulCount: 10, verified: true },
  { id: 'r-37', author: 'Dilara Yüksel', role: 'Randevu Alan Müşteri', city: 'İzmir', rating: 5, comment: 'Üye olmadan, şifre ezberlemeden sadece ad soyad ve telefonla 15 saniyede randevu alınabilmesi muazzam.', dateLabel: '1 ay önce', helpfulCount: 19, verified: true },
  { id: 'r-38', author: 'İbrahim Çolak', role: 'Kuaför İşletmecisi', city: 'Gaziantep', rating: 5, comment: 'Personel bazlı performans grafiği sayesinde salonda hangi ustamızın kaç seans yaptığını net şekilde takip edebiliyoruz.', dateLabel: '2 ay önce', helpfulCount: 17, verified: true },
  { id: 'r-39', author: 'Nihan Soylu', role: 'Yoga & Reformer Stüdyosu', city: 'Antalya', rating: 3, comment: 'Bireysel seanslar için çok iyi çalışıyor, ileride toplu grup dersleri için kontenjanlı randevu özelliği de gelirse 5 yıldız.', dateLabel: '2 ay önce', helpfulCount: 12, verified: true },
  { id: 'r-40', author: 'Ahmet Kılıçarslan', role: 'Berber & Bakım', city: 'Kayseri', rating: 5, comment: 'Tıraş yaparken telefon çalınca ya müşteriyi bekletiyordum ya telefonu açamıyordum. Şimdi telefon çalmıyor, bildirim düşüyor.', dateLabel: '2 ay önce', helpfulCount: 25, verified: true },
  { id: 'r-41', author: 'Selin Başar', role: 'Kalıcı Makyaj Uzmanı', city: 'İstanbul', rating: 5, comment: 'Tasarımı çok şık ve güven veriyor. Müşterilerim randevu sayfasını görünce kurumsallığımıza hayran kalıyor.', dateLabel: '2 ay önce', helpfulCount: 18, verified: true },
  { id: 'r-42', author: 'Mehmet Ali Tunç', role: 'Kombi & Klima Servisi', city: 'Kocaeli', rating: 4, comment: 'Bakım randevularımızı mahalle mahalle saatlere bölüp buradan alıyoruz. Çok pratik bir altyapı.', dateLabel: '2 ay önce', helpfulCount: 9, verified: true },
  { id: 'r-43', author: 'Zehra Işık', role: 'Podoloji & Ayak Bakım', city: 'Ankara', rating: 5, comment: 'Hijyen ve hazırlık için seans aralarını 30-45 dakika olarak ayarlayabilmek bizim sektörümüz için çok önemliydi, sorunsuz çalışıyor.', dateLabel: '2 ay önce', helpfulCount: 15, verified: true },
  { id: 'r-44', author: 'Koray Özdemir', role: 'Randevu Alan Müşteri', city: 'İstanbul', rating: 5, comment: 'Toplantım uzayınca randevumu telefondan tek tıkla iptal edip ertesi güne yeni saat aldım. Kimseyi arayıp mahcup olmaya gerek kalmadı.', dateLabel: '2 ay önce', helpfulCount: 21, verified: true },
  { id: 'r-45', author: 'Gamze Yaman', role: 'Saç Tasarım & Kuaför', city: 'Eskişehir', rating: 4, comment: 'Hizmet fiyatlarını kolayca güncelleyebiliyoruz, müşteriler de gelmeden önce güncel fiyat listesini görüyor, sürpriz olmuyor.', dateLabel: '2 ay önce', helpfulCount: 14, verified: true },
  { id: 'r-46', author: 'Furkan Kayaalp', role: 'Erkek Kuaförü', city: 'Samsun', rating: 5, comment: 'QR kodlu masaüstü kartını kasanın yanına koyduk. Müşteri çıkarken bir sonraki tıraş randevusunu okutup alıyor.', dateLabel: '2 ay önce', helpfulCount: 23, verified: true },
  { id: 'r-47', author: 'Ceren Mutlu', role: 'Güzellik Uzmanı', city: 'İzmir', rating: 5, comment: 'Müşteri veritabanı (CRM) özelliği sayesinde alerjisi veya hassasiyeti olan müşterilerime özel notlar düşebiliyorum.', dateLabel: '2 ay önce', helpfulCount: 16, verified: true },
  { id: 'r-48', author: 'Levent Akın', role: 'Oto Cam Filmi & Kaplama', city: 'Bursa', rating: 3, comment: 'Sistem hızlı ve çakışmaları önlüyor, sadece pazar günleri bazen yarım gün açtığımızda saat değiştirmeyi unutmamak gerekiyor.', dateLabel: '2 ay önce', helpfulCount: 7, verified: true },
  { id: 'r-49', author: 'Nazlıcan Ekinci', role: 'İngilizce Özel Ders', city: 'İstanbul', rating: 5, comment: 'Öğrencilerimle haftalık konuşma pratiği saatlerimizi RANDEVORY üzerinden planlıyoruz. Zaman yönetimim %100 iyileşti.', dateLabel: '2 ay önce', helpfulCount: 13, verified: true },
  { id: 'r-50', author: 'Halil İbrahim Yavuz', role: 'Berber Salonu', city: 'Konya', rating: 5, comment: 'Esnaf dostu bir sistem. Karmaşık menüler yok, ne ararsan elinin altında.', dateLabel: '2 ay önce', helpfulCount: 19, verified: true },
  { id: 'r-51', author: 'Berna Sezer', role: 'Lazer Epilasyon & Bakım', city: 'Adana', rating: 5, comment: 'Günde ortalama 35-40 randevu alıyoruz, bir kere bile takılma veya çift randevu sorunu yaşamadık.', dateLabel: '2 ay önce', helpfulCount: 27, verified: true },
  { id: 'r-52', author: 'Yasin Cengiz', role: 'Randevu Alan Müşteri', city: 'Antalya', rating: 4, comment: 'Oto yıkama için sıra beklemekten nefret ediyordum, randevumu alıp gittim hemen aracı içeri aldılar.', dateLabel: '2 ay önce', helpfulCount: 12, verified: true },
  { id: 'r-53', author: 'Kübra Alkan', role: 'Güzellik Merkezi', city: 'Mersin', rating: 5, comment: 'WhatsApp üzerinden müşteriye tek tıkla onay kartı göndermek çok havalı duruyor, müşterilerimiz çok beğeniyor.', dateLabel: '2 ay önce', helpfulCount: 20, verified: true },
  { id: 'r-54', author: 'Tamer Eroğlu', role: 'Diş Kliniği Koordinatörü', city: 'İstanbul', rating: 5, comment: 'Hekimlerimizin muayene saatlerini ayrı ayrı yönetebiliyoruz. Asistanımızın iş yükü yarı yarıya azaldı.', dateLabel: '2 ay önce', helpfulCount: 24, verified: true },
  { id: 'r-55', author: 'Şeyma Nur Doğan', role: 'Protez Tırnak Stüdyosu', city: 'Ankara', rating: 4, comment: 'Instagram hikayelerime randevu linkimi eklediğim gün 12 yeni randevu geldi. Çok memnunum.', dateLabel: '2 ay önce', helpfulCount: 18, verified: true },
  { id: 'r-56', author: 'Orhan Gündüz', role: 'Erkek Kuaförü', city: 'Diyarbakır', rating: 5, comment: 'Bayram öncesi yoğunlukta her sene kargaşa çıkardı, bu sene herkes saatinde geldi saatinde çıktı.', dateLabel: '2 ay önce', helpfulCount: 32, verified: true },
  { id: 'r-57', author: 'Aylin Çelikten', role: 'Cilt & Vücut Bakım', city: 'İzmir', rating: 5, comment: 'Müşterilerin önceki randevu sayılarını ve sadakatini görebilmek kampanya yaparken çok işimize yarıyor.', dateLabel: '3 ay önce', helpfulCount: 14, verified: true },
  { id: 'r-58', author: 'Erdem Soydan', role: 'Bilgisayar Teknik Servisi', city: 'Bursa', rating: 3, comment: 'Cihaz teslim ve bakım randevuları için kullanıyoruz. İşlevsel bir site, kredi kartı ile online kapora alma özelliği de gelirse harika olur.', dateLabel: '3 ay önce', helpfulCount: 15, verified: true },
  { id: 'r-59', author: 'Betül Karaman', role: 'Kuaför & Türban Tasarım', city: 'Kayseri', rating: 5, comment: 'Nişan ve düğün günlerinde saatlerimizi dakika dakika planlamamızı sağladı. Kesinlikle tavsiye ederim.', dateLabel: '3 ay önce', helpfulCount: 21, verified: true },
  { id: 'r-60', author: 'Cenk Yıldız', role: 'Randevu Alan Müşteri', city: 'İstanbul', rating: 5, comment: 'Sayfa çok hızlı açılıyor, reklamsız ve tertemiz bir randevu ekranı var.', dateLabel: '3 ay önce', helpfulCount: 11, verified: true },
  { id: 'r-61', author: 'Gülşen Arıkan', role: 'Masaj & Spa Merkezi', city: 'Muğla', rating: 5, comment: 'Turistik bölgede çalışıyoruz, hem yerli hem yabancı müşterilerimiz kolayca saat seçip randevu oluşturabiliyor.', dateLabel: '3 ay önce', helpfulCount: 17, verified: true },
  { id: 'r-62', author: 'Ömer Faruk Polat', role: 'VIP Erkek Kuaförü', city: 'İstanbul', rating: 5, comment: 'Damat tıraşı paketlerimizi ve günlük kesimleri ayrı ayrı tanımladık. Ciro takibi özelliği gerçekten çok başarılı.', dateLabel: '3 ay önce', helpfulCount: 26, verified: true },
  { id: 'r-63', author: 'Hande Toprak', role: 'Klinik Psikolog', city: 'Ankara', rating: 4, comment: 'Danışanlarımın mahremiyeti ve KVKK onayı benim için çok önemliydi. Altyapı bu konuda oldukça özenli hazırlanmış.', dateLabel: '3 ay önce', helpfulCount: 13, verified: true },
  { id: 'r-64', author: 'Rıza Çetin', role: 'Oto Elektrik & Diyagnostik', city: 'İzmir', rating: 5, comment: 'Sanayide randevulu çalışan nadir dükkanlardan biriyiz, müşterilerimiz bu disiplini çok takdir ediyor.', dateLabel: '3 ay önce', helpfulCount: 19, verified: true },
  { id: 'r-65', author: 'Nisa Nur Kaya', role: 'İpek Kirpik Uzmanı', city: 'Antalya', rating: 5, comment: 'Kendi başıma çalışıyorum, işlem yaparken telefona bakamıyordum. Artık ben çalışırken randevularım kendi kendine doluyor.', dateLabel: '3 ay önce', helpfulCount: 29, verified: true },
  { id: 'r-66', author: 'Samet Albayrak', role: 'Randevu Alan Müşteri', city: 'Samsun', rating: 4, comment: 'İşletmeye mesaj yazma kısmından otopark olup olmadığını sordum, 1 dakikada cevap verdiler. Çok kullanışlı.', dateLabel: '3 ay önce', helpfulCount: 10, verified: true },
  { id: 'r-67', author: 'Didem Uslu', role: 'Güzellik Akademisi', city: 'İstanbul', rating: 5, comment: '10 kişilik uzman kadromuzu Profesyonel paket ile tek panelden yönetiyoruz. Karışıklık sıfır.', dateLabel: '3 ay önce', helpfulCount: 22, verified: true },
  { id: 'r-68', author: 'Enes Kurtuluş', role: 'Berber Salonu', city: 'Erzurum', rating: 5, comment: 'Müşterilerimiz randevu almayı çok sevdi, özellikle gençler telefonla aramak yerine direkt linkten alıyor.', dateLabel: '3 ay önce', helpfulCount: 16, verified: true },
  { id: 'r-69', author: 'Tuba Şentürk', role: 'Beslenme Uzmanı', city: 'Bursa', rating: 3, comment: 'Genel olarak memnunum, sadece tatil günlerimizi toplu olarak kapatma menüsü biraz daha görünür yere konulabilir.', dateLabel: '3 ay önce', helpfulCount: 8, verified: true },
  { id: 'r-70', author: 'Alperen Özcan', role: 'Oto Detailing', city: 'Ankara', rating: 5, comment: 'Pasta cila ve boya koruma gibi uzun süren işleri yönetmek için birebir. Tavsiye ederim.', dateLabel: '3 ay önce', helpfulCount: 14, verified: true },
  { id: 'r-71', author: 'Simge Karakaş', role: 'Kadın Kuaförü', city: 'İzmir', rating: 5, comment: 'Yönetim paneli mobilde uygulama gibi çalışıyor. Ana ekrana kısayol ekledim, her an elimde.', dateLabel: '3 ay önce', helpfulCount: 25, verified: true },
  { id: 'r-72', author: 'Veli Doğru', role: 'Erkek Kuaförü', city: 'Adana', rating: 4, comment: 'Fiyatları gayet makul, ücretsiz paketi bile tek kişilik dükkanı olan bir esnafın tüm işini görüyor.', dateLabel: '3 ay önce', helpfulCount: 18, verified: true },
  { id: 'r-73', author: 'Aslıhan Demirci', role: 'Randevu Alan Müşteri', city: 'İstanbul', rating: 5, comment: 'Gece saat 01:30’da aklıma geldi, kuaförümden ertesi güne randevumu aldım. 7/24 açık olması harika.', dateLabel: '3 ay önce', helpfulCount: 27, verified: true },
  { id: 'r-74', author: 'Metin Baş', role: 'Veteriner Kliniği', city: 'Çanakkale', rating: 5, comment: 'Hasta sahiplerinin bekleme salonunda yığılmasını önledi. Herkes kendi saatinde geliyor.', dateLabel: '3 ay önce', helpfulCount: 15, verified: true },
  { id: 'r-75', author: 'Hilal Yavuzer', role: 'El & Ayak Bakım Merkezi', city: 'Gaziantep', rating: 5, comment: 'Müşteri kayıtlarında kimin toplam ne kadar harcama yaptığını görmek VIP müşterilerimizi belirlememizi sağladı.', dateLabel: '3 ay önce', helpfulCount: 19, verified: true },
  { id: 'r-76', author: 'Kaan Altun', role: 'Kişisel Antrenör (PT)', city: 'İstanbul', rating: 4, comment: 'Özel ders verdiğim üyelerim haftalık antrenman saatlerini bu link üzerinden kendileri seçiyor, çok pratik.', dateLabel: '3 ay önce', helpfulCount: 12, verified: true },
  { id: 'r-77', author: 'Züleyha Çevik', role: 'Güzellik & Cilt Bakımı', city: 'Konya', rating: 5, comment: 'Nasıl Kullanılır rehberi sayesinde personellerimiz sistemi 5 dakikada öğrendi.', dateLabel: '3 ay önce', helpfulCount: 14, verified: true },
  { id: 'r-78', author: 'Okan Sevim', role: 'Randevu Alan Müşteri', city: 'Kocaeli', rating: 3, comment: 'Sistem güzel ve hızlı, sadece randevu aldıktan sonra takvime ekle (Google Takvim) butonu da olsa daha iyi olurdu.', dateLabel: '4 ay önce', helpfulCount: 9, verified: true },
  { id: 'r-79', author: 'Filiz Sönmez', role: 'Kuaför & Güzellik Salonu', city: 'Antalya', rating: 5, comment: 'İki şubemiz için de kullanıyoruz, personel renk kodları sayesinde takvim çok net okunuyor.', dateLabel: '4 ay önce', helpfulCount: 21, verified: true },
  { id: 'r-80', author: 'Harun Reşit Kaya', role: 'Erkek Kuaförü', city: 'Malatya', rating: 5, comment: 'Müşteriye değer verdiğimizi gösteren modern bir sistem. Dükkana gelen herkes nasıl kurduğumuzu soruyor.', dateLabel: '4 ay önce', helpfulCount: 17, verified: true },
  { id: 'r-81', author: 'Buse Nur Aydın', role: 'Nail Studio Sahibi', city: 'İstanbul', rating: 5, comment: 'Randevu iptal kuralını 2 saat öncesine ayarladım, son dakika iptalleri neredeyse tamamen bitti.', dateLabel: '4 ay önce', helpfulCount: 23, verified: true },
  { id: 'r-82', author: 'Serhat Kılıç', role: 'Oto Yıkama & Kuaför', city: 'Mersin', rating: 4, comment: 'Hafta sonu yoğunluğunu yönetmek için birebir. Müşteri boş saati görüp ona göre aracını getiriyor.', dateLabel: '4 ay önce', helpfulCount: 11, verified: true },
  { id: 'r-83', author: 'Melek Özkan', role: 'Kaş Kontür & Microblading', city: 'İzmir', rating: 5, comment: 'Önceden Instagram DM’den randevu yazmaktan akşamları aileme vakit ayıramıyordum. Şimdi DM’ye otomatik randevu linkimi koydum, hayatım kurtuldu.', dateLabel: '4 ay önce', helpfulCount: 35, verified: true },
  { id: 'r-84', author: 'Çağrı Demir', role: 'Müzik & Gitar Eğitmeni', city: 'Ankara', rating: 5, comment: 'Öğrencilerimin ders saatlerini organize etmek için kullanıyorum. Hem sade hem de çok hızlı.', dateLabel: '4 ay önce', helpfulCount: 13, verified: true },
  { id: 'r-85', author: 'Nurgül Şahin', role: 'Güzellik Salonu', city: 'Sivas', rating: 4, comment: 'Kullanımı çok kolay, bilgisayarla arası iyi olmayan ortağım bile ilk günden rahatça kullandı.', dateLabel: '4 ay önce', helpfulCount: 15, verified: true },
  { id: 'r-86', author: 'Polat Alemdar Yılmaz', role: 'Erkek Kuaförü', city: 'İstanbul', rating: 5, comment: 'Saç, sakal ve cilt bakımı paketlerimizi ayrı ayrı girdik. Müşteriler fiyatları görerek seçtiği için kasada pazarlık muhabbeti de bitti.', dateLabel: '4 ay önce', helpfulCount: 28, verified: true },
  { id: 'r-87', author: 'Ece Vural', role: 'Randevu Alan Müşteri', city: 'Bursa', rating: 5, comment: 'Pilates stüdyom bu sistemi kullanıyor, haftalık seansımı seçmek 10 saniyemi bile almıyor.', dateLabel: '4 ay önce', helpfulCount: 12, verified: true },
  { id: 'r-88', author: 'Muhammed Ali Koç', role: 'Berber & Saç Tasarım', city: 'Şanlıurfa', rating: 5, comment: 'Vitrin QR afişini çıkartıp çerçevelettik, müşterilerimiz çok beğendi.', dateLabel: '4 ay önce', helpfulCount: 19, verified: true },
  { id: 'r-89', author: 'Süheyla Kurt', role: 'Lazer & Cilt Bakımı', city: 'Edirne', rating: 3, comment: 'Program güzel çalışıyor, sadece ilk kayıt olurken doğrulama maili spam kutusuna düşmüştü, oradan bulup onayladım.', dateLabel: '4 ay önce', helpfulCount: 7, verified: true },
  { id: 'r-90', author: 'Atilla Öz', role: 'Klima & Beyaz Eşya Servisi', city: 'Antalya', rating: 5, comment: 'Yazın Antalya sıcağında klima servis randevularını sıraya koymak imkansızdı, bu sistemle düzene girdik.', dateLabel: '4 ay önce', helpfulCount: 16, verified: true },
  { id: 'r-91', author: 'Gülbahar Tekin', role: 'Kadın Kuaförü', city: 'Ordu', rating: 5, comment: 'Personellerimin çalışma saatlerini ve izin günlerini ayrı ayrı ayarlayabilmek çok büyük kolaylık.', dateLabel: '4 ay önce', helpfulCount: 14, verified: true },
  { id: 'r-92', author: 'Batuhan Çelik', role: 'Randevu Alan Müşteri', city: 'İstanbul', rating: 4, comment: 'Hızlı ve sorunsuz çalışıyor. Randevu kodunu ekran görüntüsü almak yetiyor.', dateLabel: '4 ay önce', helpfulCount: 10, verified: true },
  { id: 'r-93', author: 'Sevgi Doğanay', role: 'Estetik & Bakım Merkezi', city: 'İzmir', rating: 5, comment: 'Müşteri mesajları bölümü sayesinde randevu alan kişiyle anında yazışabiliyoruz, iletişim kopukluğu olmuyor.', dateLabel: '4 ay önce', helpfulCount: 21, verified: true },
  { id: 'r-94', author: 'Doğanay Arslan', role: 'Erkek Kuaförü', city: 'Çorum', rating: 5, comment: 'Defter sayfası çevirmekten kurtulduk. Hangi gün kaç tıraş yapmışız, ne kadar kazanmışız hepsi ekranda.', dateLabel: '4 ay önce', helpfulCount: 18, verified: true },
  { id: 'r-95', author: 'Aleyna Tilki Yılmaz', role: 'Tırnak & İpek Kirpik', city: 'İstanbul', rating: 5, comment: 'Kızlar arasında linkimiz elden ele dolaşıyor, randevu almak çok kolay olduğu için yeni müşteri sayımız arttı.', dateLabel: '5 ay önce', helpfulCount: 24, verified: true },
  { id: 'r-96', author: 'Cemalettin Korkmaz', role: 'Oto Yıkama & Detailing', city: 'Hatay', rating: 4, comment: 'Güzel ve sağlam bir sistem, esnafın işini kolaylaştırıyor.', dateLabel: '5 ay önce', helpfulCount: 11, verified: true },
  { id: 'r-97', author: 'Nalan Bozkurt', role: 'Diyetisyen & Beslenme', city: 'Ankara', rating: 5, comment: 'Danışanlarımın randevu sadakati arttı, iptal edeceklerse önceden sistemden iptal ediyorlar ve o saati başka danışanım alabiliyor.', dateLabel: '5 ay önce', helpfulCount: 17, verified: true },
  { id: 'r-98', author: 'Yunus Emre Şahin', role: 'Berber Salonu', city: 'Afyonkarahisar', rating: 5, comment: 'Kurulumu 3 dakikada yaptım, hemen linkimi WhatsApp durumumda paylaştım ve ilk randevum 5 dakika sonra düştü.', dateLabel: '5 ay önce', helpfulCount: 26, verified: true },
  { id: 'r-99', author: 'Berrin Aksoy', role: 'Güzellik Merkezi', city: 'Zonguldak', rating: 3, comment: 'Takvim ekranı gayet net, sadece telefondan girince haftalık görünüm yerine günlük görünüm daha rahat kullanılıyor.', dateLabel: '5 ay önce', helpfulCount: 8, verified: true },
  { id: 'r-100', author: 'Tufan Güneş', role: 'Pet Kuaför & Bakım', city: 'İstanbul', rating: 5, comment: 'Kedi ve köpek tıraşı için randevu alıyoruz, sahipleri not kısmına evcil hayvanın cinsini ve huyunu yazıyor, süper oluyor.', dateLabel: '5 ay önce', helpfulCount: 22, verified: true },
  { id: 'r-101', author: 'Rabia Nur Çetin', role: 'Cilt Bakım & Hydrafacial', city: 'Bursa', rating: 5, comment: 'Sektördeki en temiz ve en hızlı randevu programı. Müşterilerim hiç zorlanmadan kullanıyor.', dateLabel: '5 ay önce', helpfulCount: 15, verified: true },
  { id: 'r-102', author: 'Ferhat Demir', role: 'Erkek Kuaförü', city: 'Van', rating: 5, comment: 'Tek koltuk çalışıyorum, başlangıç paketinin ücretsiz olması benim gibi yeni dükkan açanlar için büyük destek.', dateLabel: '5 ay önce', helpfulCount: 30, verified: true },
  { id: 'r-103', author: 'Sena Yüksel', role: 'Randevu Alan Müşteri', city: 'İzmir', rating: 4, comment: 'Saç boyama randevumu buradan aldım, fiyatların önceden yazması çok iyi.', dateLabel: '5 ay önce', helpfulCount: 12, verified: true },
  { id: 'r-104', author: 'Engin Altan Kaya', role: 'Fizyoterapist', city: 'Ankara', rating: 5, comment: 'Seans planlaması kusursuz. Çakışma önleme algoritması gerçekten sıfır hatayla çalışıyor.', dateLabel: '5 ay önce', helpfulCount: 19, verified: true },
  { id: 'r-105', author: 'Özge Ulusoy Çelik', role: 'Kalıcı Makyaj & Bakım', city: 'İstanbul', rating: 5, comment: 'Hem masaüstünde hem telefonda çok şık duruyor. İşletmemize prestij kattı.', dateLabel: '5 ay önce', helpfulCount: 20, verified: true },
  { id: 'r-106', author: 'Ramazan Öztürk', role: 'Berber & Kuaför', city: 'Kahramanmaraş', rating: 4, comment: 'WhatsApp onay mesajı özelliği sayesinde müşterilerimize kurumsal mesaj atabiliyoruz, çok beğendik.', dateLabel: '5 ay önce', helpfulCount: 14, verified: true },
  { id: 'r-107', author: 'Melisa Aslı Pamukçu', role: 'Güzellik Stüdyosu', city: 'Antalya', rating: 5, comment: 'Müşteri takibi, ciro hesabı, QR kod afişi... Bir işletmenin ihtiyacı olan her şeyi tek çatı altında toplamışlar.', dateLabel: '5 ay önce', helpfulCount: 25, verified: true },
  { id: 'r-108', author: 'Hüseyin Avni Yılmaz', role: 'Erkek Bakım Merkezi', city: 'İstanbul', rating: 5, comment: 'Yıllardır defterle uğraşıyorduk, dijitalleşmek işimizi %50 hızlandırdı. Emeği geçen herkese teşekkürler.', dateLabel: '5 ay önce', helpfulCount: 33, verified: true },
];

export function ReviewsSection() {
  const [reviews, setReviews] = useState<SiteReview[]>(INITIAL_REVIEWS);
  const [filterRating, setFilterRating] = useState<'all' | 5 | 4 | 3>('all');
  const [visibleCount, setVisibleCount] = useState(9);

  // Site Like ("Siteyi Beğendim") State
  const [siteLikesCount, setSiteLikesCount] = useState(1842);
  const [hasLikedSite, setHasLikedSite] = useState(false);

  // Helpful review clicks
  const [likedReviewIds, setLikedReviewIds] = useState<Record<string, boolean>>({});

  // Add Review Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRole, setNewRole] = useState('İşletme Sahibi');
  const [newCity, setNewCity] = useState('İstanbul');
  const [newRating, setNewRating] = useState<5 | 4 | 3 | 2 | 1>(5);
  const [newComment, setNewComment] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSiteLike = localStorage.getItem('randevory_site_liked');
      if (savedSiteLike === 'true') {
        setHasLikedSite(true);
        setSiteLikesCount(1843);
      }

      const savedCustomReviews = localStorage.getItem('randevory_custom_reviews');
      if (savedCustomReviews) {
        try {
          const parsed = JSON.parse(savedCustomReviews);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReviews([...parsed, ...INITIAL_REVIEWS]);
          }
        } catch {
          // ignore parse error
        }
      }
    }
  }, []);

  const handleToggleSiteLike = () => {
    const nextLiked = !hasLikedSite;
    setHasLikedSite(nextLiked);
    setSiteLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));
    if (typeof window !== 'undefined') {
      localStorage.setItem('randevory_site_liked', String(nextLiked));
    }
  };

  const handleHelpfulClick = (id: string) => {
    if (likedReviewIds[id]) return;
    setLikedReviewIds((prev) => ({ ...prev, [id]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) return;

    const created: SiteReview = {
      id: `custom-${Date.now()}`,
      author: newAuthor.trim(),
      role: newRole.trim() || 'Kullanıcı',
      city: newCity.trim() || 'Türkiye',
      rating: newRating,
      comment: newComment.trim(),
      dateLabel: 'Az önce',
      helpfulCount: 1,
      verified: true,
    };

    const updated = [created, ...reviews];
    setReviews(updated);

    if (typeof window !== 'undefined') {
      const existingCustom = updated.filter((r) => r.id.startsWith('custom-'));
      localStorage.setItem('randevory_custom_reviews', JSON.stringify(existingCustom));
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowAddModal(false);
      setNewAuthor('');
      setNewComment('');
      setNewRating(5);
    }, 1200);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = total > 0 ? (sum / total).toFixed(1) : '4.8';
    const count5 = reviews.filter((r) => r.rating === 5).length;
    const count4 = reviews.filter((r) => r.rating === 4).length;
    const count3 = reviews.filter((r) => r.rating <= 3).length;
    return {
      total,
      avg,
      count5,
      count4,
      count3,
      pct5: Math.round((count5 / total) * 100),
      pct4: Math.round((count4 / total) * 100),
      pct3: Math.round((count3 / total) * 100),
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (filterRating === 'all') return reviews;
    if (filterRating === 3) return reviews.filter((r) => r.rating <= 3);
    return reviews.filter((r) => r.rating === filterRating);
  }, [reviews, filterRating]);

  const displayedReviews = filteredReviews.slice(0, visibleCount);

  return (
    <section id="yorumlar" className="scroll-mt-28 py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            Türkiye Genelinde {stats.total}+ Onaylı İşletme & Müşteri Değerlendirmesi
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Kullanıcılarımız <span className="text-brand-600">RANDEVORY</span> İçin Ne Diyor?
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Kuaförlerden kliniklere, oto bakımdan güzellik merkezlerine kadar yüzlerce işletme ve müşterinin gerçek deneyimleri.
          </p>
        </div>

        {/* Rating Dashboard & "Siteyi Beğendim" Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-10 shadow-xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Big Score */}
          <div className="lg:col-span-4 text-center lg:text-left lg:border-r border-slate-800 lg:pr-8">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div className="text-5xl font-black text-white">{stats.avg}</div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Toplam <strong className="text-white">{stats.total} değerlendirme</strong> üzerinden
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <button
                type="button"
                onClick={handleToggleSiteLike}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  hasLikedSite
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLikedSite ? 'fill-white text-white' : 'text-rose-400'}`} />
                <span>{hasLikedSite ? 'Siteyi Beğendiniz!' : 'Siteyi Beğendim'}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/25 text-[11px]">
                  {siteLikesCount.toLocaleString('tr-TR')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-brand-600/25"
              >
                <MessageSquarePlus className="w-4 h-4" />
                Puan Ver & Yorum Yap
              </button>
            </div>
          </div>

          {/* Center: Star Distribution Bars */}
          <div className="lg:col-span-5 space-y-2.5 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-16 font-semibold text-slate-300 flex items-center gap-1">
                5 Yıldız <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${stats.pct5}%` }} />
              </div>
              <span className="w-16 text-right text-slate-400 font-mono">
                {stats.count5} ({stats.pct5}%)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-16 font-semibold text-slate-300 flex items-center gap-1">
                4 Yıldız <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stats.pct4}%` }} />
              </div>
              <span className="w-16 text-right text-slate-400 font-mono">
                {stats.count4} ({stats.pct4}%)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-16 font-semibold text-slate-300 flex items-center gap-1">
                3 Yıldız <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${stats.pct3}%` }} />
              </div>
              <span className="w-16 text-right text-slate-400 font-mono">
                {stats.count3} ({stats.pct3}%)
              </span>
            </div>
          </div>

          {/* Right: Satisfaction Highlight */}
          <div className="lg:col-span-3 bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 text-center">
            <div className="text-3xl font-black text-emerald-400">%96</div>
            <div className="text-xs font-bold text-white mt-1">Tavsiye Etme Oranı</div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Kullanıcılarımızın %96&apos;sı RANDEVORY&apos;yi kendi sektöründeki diğer işletmelere öneriyor.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filtrele:
            </span>
            {[
              { key: 'all', label: `Tümü (${stats.total})` },
              { key: 5, label: `5 Yıldız (${stats.count5})` },
              { key: 4, label: `4 Yıldız (${stats.count4})` },
              { key: 3, label: `3 Yıldız (${stats.count3})` },
            ].map((tab) => (
              <button
                key={String(tab.key)}
                type="button"
                onClick={() => {
                  setFilterRating(tab.key as any);
                  setVisibleCount(9);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterRating === tab.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            Gösterilen: <strong>{displayedReviews.length}</strong> / {filteredReviews.length} yorum
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedReviews.map((review) => {
            const isHelpfulClicked = Boolean(likedReviewIds[review.id]);
            return (
              <div
                key={review.id}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{review.author}</span>
                          <span title="Doğrulanmış Kullanıcı" className="inline-flex">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {review.role} • {review.city}
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((starNum) => (
                        <Star
                          key={starNum}
                          className={`w-3.5 h-3.5 ${
                            starNum <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{review.dateLabel}</span>
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(review.id)}
                    className={`flex items-center gap-1 font-semibold transition-colors ${
                      isHelpfulClicked
                        ? 'text-brand-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Faydalı ({review.helpfulCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Buttons */}
        {visibleCount < filteredReviews.length && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 18)}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
            >
              <ChevronDown className="w-4 h-4" />
              Daha Fazla Yorum Göster (+18 Yorum)
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(filteredReviews.length)}
              className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
            >
              Tümünü Göster ({filteredReviews.length})
            </button>
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-base text-slate-900">RANDEVORY&apos;yi Değerlendirin</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-10 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-base text-slate-900">Teşekkür Ederiz!</h4>
                <p className="text-xs text-slate-500">Değerlendirmeniz ve yorumunuz başarıyla eklendi.</p>
              </div>
            ) : (
              <form onSubmit={handleAddReview} className="py-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Puanınız *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star as any)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= newRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-sm text-slate-700">{newRating} / 5 Yıldız</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adınız ve Soyadınız *</label>
                  <input
                    type="text"
                    required
                    placeholder="Adınız ve Soyadınız"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sektör / Rol</label>
                    <input
                      type="text"
                      placeholder="Örn: Kuaför / Müşteri"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Şehir</label>
                    <input
                      type="text"
                      placeholder="Örn: İstanbul"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deneyiminiz / Yorumunuz *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="RANDEVORY hakkındaki düşüncelerinizi yazın..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
                  >
                    Yorumu Yayınla
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
