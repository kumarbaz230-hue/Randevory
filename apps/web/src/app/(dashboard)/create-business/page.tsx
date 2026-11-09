'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { repo } from '@/lib/supabase-repository';
import { BusinessSector } from '@/types';
import { Building, Sparkles, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function CreateBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sector, setSector] = useState<BusinessSector>('barber');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    // Otomatik slug önerisi üret
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    setSlug(generatedSlug);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await repo.createBusiness({
        name,
        slug,
        sector,
        phone,
        email,
        address,
        city,
        district: district || undefined,
        description: description || undefined,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'İşletme profili oluşturulurken bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">İşletmenizi Tanımlayın</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Müşterilerinizin internetten randevu alabileceği işletme profilini oluşturun
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">İşletme Adı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Star Kuaför & Güzellik"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Özel Randevu Bağlantı Adresi (Slug) *</label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 font-mono text-xs">
                randevory.com/
              </span>
              <input
                type="text"
                required
                placeholder="star-kuafor"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2.5 rounded-r-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sektör *</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as BusinessSector)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="barber">Berber & Erkek Kuaförü</option>
                <option value="hair_salon">Kadın Kuaförü & Saç Tasarım</option>
                <option value="beauty_salon">Güzellik & Cilt Bakım Merkezi</option>
                <option value="cafe_restaurant">Kafe, Restoran & Masa Rezervasyonu</option>
                <option value="fitness_pilates">Fitness, Pilates & Spor Salonu</option>
                <option value="activity_gaming">Oyun Salonu, PS & Bilardo</option>
                <option value="auto_wash_care">Oto Yıkama & Detailing</option>
                <option value="tutoring_education">Özel Ders & Eğitim Merkezi</option>
                <option value="tech_service">Teknik Servis & Tamir</option>
                <option value="veterinary">Veteriner Kliniği</option>
                <option value="consulting">Danışmanlık</option>
                <option value="other">Diğer Randevulu Hizmet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">İletişim Telefonu *</label>
              <input
                type="tel"
                required
                placeholder="0212 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">E-posta</label>
              <input
                type="email"
                placeholder="iletisim@isletme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Şehir *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adres *</label>
            <input
              type="text"
              required
              placeholder="Mahalle, Cadde, No ve İlçe"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kısa Tanıtım Açıklaması</label>
            <textarea
              rows={2}
              placeholder="İşletmeniz ve verdiğiniz hizmetler hakkında kısa bilgi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Oluşturuluyor...' : 'İşletmeyi Oluştur ve Başla'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
