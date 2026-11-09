'use client';

import React, { useState, useEffect } from 'react';
import { repo } from '@/lib/supabase-repository';
import { Business, RestaurantTable } from '@/types';
import {
  DEFAULT_RESTAURANT_TABLES,
  DEFAULT_TABLE_SECTIONS,
  getBusinessTables,
} from '@/lib/table-helper';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  Users,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardTablesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Table Booking Settings
  const [enableTableBooking, setEnableTableBooking] = useState(false);
  const [defaultBookingStyle, setDefaultBookingStyle] = useState<'service' | 'table'>('table');
  const [tables, setTables] = useState<RestaurantTable[]>(DEFAULT_RESTAURANT_TABLES);

  // Active section filter
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Add Table Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newSection, setNewSection] = useState<'bahce' | 'salon' | 'teras' | 'vip'>('bahce');
  const [newCapacity, setNewCapacity] = useState(4);
  const [newFeature, setNewFeature] = useState('');
  const [newFeatures, setNewFeatures] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const b = await repo.getActiveBusiness();
      if (b) {
        setBusiness(b);
        const isEnabled = Boolean(
          b.settings?.enable_table_booking || b.sector === 'cafe_restaurant'
        );
        setEnableTableBooking(isEnabled);
        setDefaultBookingStyle(
          b.settings?.default_booking_style ||
            (b.sector === 'cafe_restaurant' ? 'table' : 'service')
        );

        if (b.settings?.custom_tables && b.settings.custom_tables.length > 0) {
          setTables(b.settings.custom_tables);
        } else {
          setTables(DEFAULT_RESTAURANT_TABLES);
        }
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (
    overrideEnabled?: boolean,
    overrideStyle?: 'service' | 'table',
    overrideTables?: RestaurantTable[]
  ) => {
    if (!business) return;
    setSaving(true);
    try {
      const finalEnabled = overrideEnabled !== undefined ? overrideEnabled : enableTableBooking;
      const finalStyle = overrideStyle !== undefined ? overrideStyle : defaultBookingStyle;
      const finalTables = overrideTables !== undefined ? overrideTables : tables;

      const updated = await repo.updateBusiness(business.id, {
        settings: {
          ...business.settings,
          enable_table_booking: finalEnabled,
          default_booking_style: finalStyle,
          custom_tables: finalTables,
        },
      });

      setBusiness(updated);
      setSuccessToast('Masa ve mekan rezervasyon düzeniniz başarıyla kaydedildi!');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Kayıt hatası:', err);
      alert('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnable = () => {
    const nextVal = !enableTableBooking;
    setEnableTableBooking(nextVal);
    handleSaveAll(nextVal, defaultBookingStyle, tables);
  };

  const handleAddTable = () => {
    if (!newTableName.trim()) {
      alert('Lütfen bir masa adı girin (Örn: Bahçe 7, VIP 3)');
      return;
    }

    const newTbl: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      name: newTableName.trim(),
      section: newSection,
      capacity: Number(newCapacity) || 2,
      features: newFeatures.length > 0 ? newFeatures : ['Ferah'],
      is_active: true,
    };

    const nextTables = [...tables, newTbl];
    setTables(nextTables);
    setShowAddModal(false);
    setNewTableName('');
    setNewFeatures([]);
    setNewFeature('');
    handleSaveAll(enableTableBooking, defaultBookingStyle, nextTables);
  };

  const handleDeleteTable = (id: string) => {
    if (confirm('Bu masayı silmek istediğinizden emin misiniz?')) {
      const nextTables = tables.filter((t) => t.id !== id);
      setTables(nextTables);
      handleSaveAll(enableTableBooking, defaultBookingStyle, nextTables);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Tüm masalar sistem varsayılan şablonuna sıfırlansın mı?')) {
      setTables(DEFAULT_RESTAURANT_TABLES);
      handleSaveAll(enableTableBooking, defaultBookingStyle, DEFAULT_RESTAURANT_TABLES);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (selectedSection === 'all') return true;
    return t.section === selectedSection;
  });

  const totalSeats = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const publicUrl = business?.slug ? `/${business.slug}` : '/';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-emerald-600/20 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masa & Mekan Düzeni
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                2. Rezervasyon Stili
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kafe, restoran, oyun salonu, bilardo, VIP loca veya açık hava mekanları için interaktif masa rezervasyonu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`${publicUrl}?style=table`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-brand-600" />
            <span>Masa Sayfasını Canlı Gör</span>
          </Link>
          <button
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <span>Kaydediliyor...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Değişiklikleri Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Switch Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Masa Rezervasyon Sistemini Aktif Et</span>
              {enableTableBooking ? (
                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded-md">
                  Aktif
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-md">
                  Pasif
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Bu özellik açıldığında müşterileriniz randevu sayfanızda bölüm (Bahçe, Salon, Teras, VIP) ve masa seçerek rezervasyon oluşturabilir.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleEnable}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
              enableTableBooking
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {enableTableBooking ? (
              <>
                <ToggleRight className="w-5 h-5" />
                <span>Masa Rezervasyonu AÇIK</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>Masa Rezervasyonu KAPALI</span>
              </>
            )}
          </button>
        </div>

        {/* Style selector */}
        {enableTableBooking && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sayfanız Açıldığında Varsayılan Randevu Şekli
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  defaultBookingStyle === 'table'
                    ? 'border-orange-500 bg-orange-50/40 text-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="defaultStyle"
                  checked={defaultBookingStyle === 'table'}
                  onChange={() => {
                    setDefaultBookingStyle('table');
                    handleSaveAll(enableTableBooking, 'table', tables);
                  }}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
                    <span>🍽️ 2. Stil: Masa & Mekan Rezervasyonu</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Kafe, restoran veya lounge için önerilir. Sayfanızı açanlar doğrudan interaktif masa haritasını görür.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  defaultBookingStyle === 'service'
                    ? 'border-brand-600 bg-brand-50/40 text-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="defaultStyle"
                  checked={defaultBookingStyle === 'service'}
                  onChange={() => {
                    setDefaultBookingStyle('service');
                    handleSaveAll(enableTableBooking, 'service', tables);
                  }}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
                    <span>⚡ 1. Stil: Klasik Hizmet & Personel Randevusu</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Hizmet veya seans seçimi önde açılır, müşteriler dilerse üstteki sekmeden masa rezervasyonuna geçebilir.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Tables List & Manager */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Masalarınız ve Kapasite Düzeni</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {tables.length} Masa • {totalSeats} Toplam Kapasite
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              İşletmenizdeki masaları ekleyin, bölümlere (Bahçe, Salon, Teras, VIP) ayırın ve özelliklerini belirtin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Varsayılan Masalara Sıfırla"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Şablonu Yükle</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Masa Ekle</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {DEFAULT_TABLE_SECTIONS.map((sec) => {
            const count =
              sec.id === 'all'
                ? tables.length
                : tables.filter((t) => t.section === sec.id).length;
            const active = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSection(sec.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
          {filteredTables.map((tbl) => {
            const secInfo = DEFAULT_TABLE_SECTIONS.find((s) => s.id === tbl.section);
            return (
              <div
                key={tbl.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-orange-300 hover:shadow-xs transition-all relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {tbl.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(tbl.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                      title="Masayı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {tbl.capacity} Kişilik
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {secInfo?.label.split('/')[0]}
                    </span>
                  </div>

                  {tbl.features && tbl.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {tbl.features.map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Rezervasyona Açık
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Yeni Masa / Loca Ekle</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masa Adı / Numarası *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bahçe Masa 5, Teras 2, VIP 1"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bölüm
                  </label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="bahce">🌿 Bahçe / Açık Hava</option>
                    <option value="salon">🏠 Ana Salon</option>
                    <option value="teras">🌅 Teras / Manzara</option>
                    <option value="vip">⭐ VIP Loca</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kapasite (Kişi)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Özellikler (Etiketler)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Örn: Prizli, Klimalı, Cam Kenarı"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFeature.trim()) {
                        setNewFeatures((p) => [...p, newFeature.trim()]);
                        setNewFeature('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  >
                    Ekle
                  </button>
                </div>
                {newFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newFeatures.map((f, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-medium flex items-center gap-1"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => setNewFeatures((p) => p.filter((_, idx) => idx !== i))}
                          className="hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleAddTable}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Masayı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
