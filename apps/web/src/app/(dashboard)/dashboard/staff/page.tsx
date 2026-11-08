'use client';

import React, { useState, useEffect, useRef } from 'react';
import { store } from '@/lib/data-store';
import { repo } from '@/lib/supabase-repository';
import { Staff, Service, Business } from '@/types';
import { compressImageToDataUrl } from '@/lib/image-helper';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit,
  Phone,
  Mail,
  Check,
  X,
  Palette,
  Camera,
  Upload,
  User,
} from 'lucide-react';

export default function DashboardStaffPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [colorCode, setColorCode] = useState('#2563eb');
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const b = await repo.getActiveBusiness();
    if (b) {
      setBusiness(b);
      const [stf, srvs] = await Promise.all([
        repo.getAllStaff(b.id),
        repo.getAllServices(b.id),
      ]);
      setStaffList(stf);
      setServices(srvs);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setTitle('Uzman');
    setPhone('');
    setEmail('');
    setAvatarUrl('');
    setColorCode('#2563eb');
    setAssignedServiceIds(services.map((s) => s.id)); // Varsayılan tüm hizmetler
    setShowModal(true);
  };

  const openEditModal = (st: Staff) => {
    setEditingStaff(st);
    setName(st.name);
    setTitle(st.title);
    setPhone(st.phone);
    setEmail(st.email || '');
    setAvatarUrl(st.avatar_url || '');
    setColorCode(st.color_code);
    setAssignedServiceIds(st.assigned_service_ids || []);
    setShowModal(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir fotoğraf seçin (JPG veya PNG).');
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, 360, 0.85);
      setAvatarUrl(dataUrl);
    } catch {
      alert('Fotoğraf yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const toggleService = (srvId: string) => {
    if (assignedServiceIds.includes(srvId)) {
      setAssignedServiceIds(assignedServiceIds.filter((id) => id !== srvId));
    } else {
      setAssignedServiceIds([...assignedServiceIds, srvId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !name.trim()) return;

    if (editingStaff) {
      await repo.updateStaff(editingStaff.id, {
        name,
        title,
        phone,
        email: email || undefined,
        avatar_url: avatarUrl || undefined,
        color_code: colorCode,
        assigned_service_ids: assignedServiceIds,
      });
    } else {
      await repo.addStaff({
        business_id: business.id,
        name,
        title,
        phone,
        email: email || undefined,
        avatar_url: avatarUrl || undefined,
        color_code: colorCode,
        is_active: true,
        assigned_service_ids: assignedServiceIds,
      });
    }

    setShowModal(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
      await repo.deleteStaff(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Personel ve Uzman Yönetimi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İşletmenizdeki çalışanları, takvim renklerini ve verebilecekleri hizmetleri yönetin.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yeni Personel Ekle
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {staffList.map((st) => (
          <div
            key={st.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {/* Color banner bar */}
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{ backgroundColor: st.color_code || '#2563eb' }}
            ></div>

            <div className="flex items-start justify-between mt-2">
              <div className="flex items-center gap-3">
                {st.avatar_url ? (
                  <img
                    src={st.avatar_url}
                    alt={st.name}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
                    style={{ backgroundColor: st.color_code || '#2563eb' }}
                  >
                    {st.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{st.name}</h3>
                  <span className="text-xs text-slate-500">{st.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(st)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(st.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{st.phone}</span>
              </div>
              {st.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{st.email}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Verebildiği Hizmetler ({st.assigned_service_ids?.length || 0}):
              </span>
              <div className="flex flex-wrap gap-1">
                {st.assigned_service_ids?.map((sId) => {
                  const s = services.find((x) => x.id === sId);
                  if (!s) return null;
                  return (
                    <span
                      key={sId}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                    >
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal (Bottom sheet on mobile) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92dvh] overflow-y-auto safe-bottom">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingStaff ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-4 text-xs">
              {/* Personel Fotoğrafı (İsteğe bağlı) */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Personel"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                      style={{ backgroundColor: colorCode }}
                    >
                      {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8 opacity-70" />}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Fotoğraf Değiştir"
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-600 text-white shadow hover:bg-brand-700"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 text-xs">Personel Fotoğrafı (İsteğe Bağlı)</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Müşteriler randevu alırken personelin fotoğrafını görebilir.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <Upload className="w-3 h-3" />
                      {isUploadingPhoto ? 'İşleniyor...' : avatarUrl ? 'Değiştir' : 'Fotoğraf Yükle'}
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-medium"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Burak Kaya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unvan / Rol</label>
                <input
                  type="text"
                  placeholder="Örn: Kıdemli Kuaför, Uzman Usta"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    placeholder="0532..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Takvim Rengi</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value)}
                      className="w-10 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                    />
                    <span className="font-mono text-slate-600">{colorCode}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verebildiği Hizmetler</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200">
                  {services.map((srv) => {
                    const isChecked = assignedServiceIds.includes(srv.id);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => toggleService(srv.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="font-medium truncate">{srv.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700"
                >
                  {editingStaff ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
