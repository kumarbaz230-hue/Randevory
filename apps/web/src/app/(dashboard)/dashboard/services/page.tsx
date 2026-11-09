'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/data-store';
import { repo } from '@/lib/supabase-repository';
import { Service, Business } from '@/types';
import { formatDuration } from '@/lib/format-duration';
import {
  Plus,
  Trash2,
  Edit,
  Clock,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

export default function DashboardServicesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>(30);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState<number | string>(5);
  const [price, setPrice] = useState<number | string>('');
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadData = async () => {
    const b = await repo.getActiveBusiness();
    if (b) {
      setBusiness(b);
      const srvs = await repo.getAllServices(b.id);
      setServices(srvs);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setCategoryName('Genel');
    setDescription('');
    setDurationMinutes(30);
    setBufferAfterMinutes(5);
    setPrice('');
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setCategoryName(service.category_name || 'Genel');
    setDescription(service.description || '');
    setDurationMinutes(service.duration_minutes);
    setBufferAfterMinutes(service.buffer_after_minutes ?? 0);
    setPrice(service.price);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !name.trim()) return;

    setSaving(true);
    const numDuration = Number(durationMinutes) > 0 ? Number(durationMinutes) : 30;
    const numBuffer = bufferAfterMinutes !== '' && Number(bufferAfterMinutes) >= 0 ? Number(bufferAfterMinutes) : 0;
    const numPrice = price !== '' && Number(price) >= 0 ? Number(price) : 0;

    try {
      if (editingService) {
        await repo.updateService(editingService.id, {
          name: name.trim(),
          category_name: categoryName.trim() || 'Genel',
          description: description.trim(),
          duration_minutes: numDuration,
          buffer_after_minutes: numBuffer,
          price: numPrice,
        });
        setSuccessToast(`"${name.trim()}" hizmeti başarıyla güncellendi!`);
      } else {
        await repo.addService({
          business_id: business.id,
          name: name.trim(),
          category_name: categoryName.trim() || 'Genel',
          description: description.trim(),
          duration_minutes: numDuration,
          buffer_after_minutes: numBuffer,
          price: numPrice,
          is_active: true,
          sort_order: services.length + 1,
        });
        setSuccessToast(`"${name.trim()}" yeni hizmet olarak eklendi!`);
      }

      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccessToast(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, srvName: string) => {
    if (confirm(`"${srvName}" hizmetini silmek istediğinizden emin misiniz?`)) {
      await repo.deleteService(id);
      await loadData();
      setSuccessToast(`"${srvName}" hizmeti silindi.`);
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] p-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{successToast}</span>
          <button type="button" onClick={() => setSuccessToast('')} className="underline text-xs">
            Kapat
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hizmet ve Fiyat Yönetimi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşterilerinize sunduğunuz tüm randevulu işlemleri, seans sürelerini ve fiyatları düzenleyin.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yeni Hizmet Ekle
        </button>
      </div>

      {/* Mobile Services Card List (App-like native cards) */}
      <div className="md:hidden space-y-3">
        {services.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Henüz hizmet tanımlanmamış. Yukarıdaki butondan yeni hizmet ekleyebilirsiniz.
          </div>
        ) : (
          services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{srv.name}</div>
                  {srv.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{srv.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-brand-600">{srv.price} ₺</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    {srv.category_name || 'Genel'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDuration(srv.duration_minutes)}{srv.buffer_after_minutes ? ` (+${srv.buffer_after_minutes} dk)` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(srv)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(srv.id, srv.name)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Services Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Hizmet Adı</th>
                <th className="px-6 py-3.5 font-semibold">Kategori</th>
                <th className="px-6 py-3.5 font-semibold">Süre & Dinlenme</th>
                <th className="px-6 py-3.5 font-semibold">Ücret</th>
                <th className="px-6 py-3.5 font-semibold">Durum</th>
                <th className="px-6 py-3.5 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 text-sm">{srv.name}</div>
                    {srv.description && (
                      <div className="text-slate-500 text-[11px] mt-0.5 max-w-sm truncate">
                        {srv.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {srv.category_name || 'Genel'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDuration(srv.duration_minutes)}
                    </div>
                    {srv.buffer_after_minutes > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        +{srv.buffer_after_minutes} dk mola payı
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                    {srv.price} ₺
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        srv.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {srv.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(srv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(srv.id, srv.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal (Bottom sheet on mobile) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92dvh] overflow-y-auto safe-bottom">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingService ? 'Hizmeti Düzenle' : 'Yeni Hizmet Tanımla'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hizmet Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Klasik Saç Kesimi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  placeholder="Örn: Saç Bakımı, Mekanik, vb."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Hizmet detayları ve kullanılan ürünler..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Duration: hour + minute picker (any minute value is allowed, e.g. 1 sa 35 dk) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Hizmet Süresi *</label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      step="1"
                      inputMode="numeric"
                      placeholder="0"
                      value={Math.floor((Number(durationMinutes) || 0) / 60)}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const h = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                        const m = (Number(durationMinutes) || 0) % 60;
                        setDurationMinutes(h * 60 + m);
                      }}
                      className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">saat</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      inputMode="numeric"
                      placeholder="30"
                      value={(Number(durationMinutes) || 0) % 60}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const m = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                        const h = Math.floor((Number(durationMinutes) || 0) / 60);
                        setDurationMinutes(h * 60 + m);
                      }}
                      className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">dk</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[15, 30, 45, 60, 75, 90, 120, 150, 180].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMinutes(m)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        Number(durationMinutes) === m
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      {formatDuration(m)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Toplam: <strong className="text-slate-800">{formatDuration(Number(durationMinutes) || 0)}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Mola Payı (Dk)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={bufferAfterMinutes}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setBufferAfterMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">Fiyat (₺) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Örn: 250"
                    value={price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 font-bold text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 text-xs sm:text-sm"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm text-xs sm:text-sm"
                >
                  {saving ? 'Kaydediliyor...' : editingService ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
