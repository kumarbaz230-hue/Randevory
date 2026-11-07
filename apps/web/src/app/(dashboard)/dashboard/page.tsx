'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/data-store';
import { repo } from '@/lib/supabase-repository';
import { Appointment, Service, Staff, Business } from '@/types';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Phone,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const loadData = async () => {
    const b = await repo.getActiveBusiness();
    if (b) {
      setBusiness(b);
      const [apts, srvs, stf] = await Promise.all([
        repo.getAppointments(b.id),
        repo.getServices(b.id),
        repo.getStaff(b.id),
      ]);
      setAppointments(apts);
      setServices(srvs);
      setStaff(stf);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (aptId: string, newStatus: Appointment['status']) => {
    await repo.updateAppointmentStatus(aptId, newStatus);
    await loadData();
  };

  // Metrics
  const totalRevenue = appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + (a.total_price || 0), 0);

  const pendingAppointments = appointments.filter((a) => a.status === 'pending');
  const todayAppointments = appointments.filter((a) => {
    const aptDate = new Date(a.start_time).toDateString();
    const today = new Date().toDateString();
    return aptDate === today;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">İşletme Özeti</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Hoş Geldiniz, {business?.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bugün planlanan toplam <span className="font-semibold text-slate-800">{todayAppointments.length} randevunuz</span> bulunuyor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/calendar"
            className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Takvime Git
          </Link>
          <Link
            href="/salon-prestij"
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            Randevu Al Sayfası <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bugünkü Randevular</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{todayAppointments.length}</div>
          <div className="text-xs text-slate-500 mt-1">Toplam randevular içerisinden</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Onay Bekleyen</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{pendingAppointments.length}</div>
          <div className="text-xs text-amber-600 mt-1 font-medium">Hemen inceleyin</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Toplam Ciro</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{totalRevenue} ₺</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Kayıtlı randevular toplamı</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aktif Personel</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{staff.length} Uzman</div>
          <div className="text-xs text-slate-500 mt-1">{services.length} farklı hizmet sunuluyor</div>
        </div>
      </div>

      {/* Today's Appointments & Pending Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Randevu Akışı</h2>
              <p className="text-xs text-slate-500">Yaklaşan ve güncel randevularınız</p>
            </div>
            <Link
              href="/dashboard/calendar"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Tümünü Takvimde Gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">Henüz kayıtlı randevu bulunmuyor.</div>
            ) : (
              appointments.map((apt) => {
                const service = services.find((s) => s.id === apt.service_id);
                const staffMember = staff.find((s) => s.id === apt.staff_id);
                const aptDate = new Date(apt.start_time);

                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: staffMember?.color_code || '#2563eb' }}
                      >
                        {staffMember?.name.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {apt.customer_name}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              apt.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : apt.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : apt.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {apt.status === 'confirmed'
                              ? 'Onaylandı'
                              : apt.status === 'pending'
                              ? 'Onay Bekliyor'
                              : apt.status === 'completed'
                              ? 'Tamamlandı'
                              : 'İptal Edildi'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-medium text-slate-800">{service?.name || 'Hizmet'}</span>
                          <span className="text-slate-400">•</span>
                          <span>Uzman: {staffMember?.name || 'Belirtilmedi'}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-slate-900">{apt.total_price} ₺</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {aptDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} saat{' '}
                          {aptDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          <span className="ml-2 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {apt.customer_phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(apt.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Onayla
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(apt.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Tamamla
                        </button>
                      )}
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(apt.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> İptal
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Links & Business Link Card */}
        <div className="space-y-6">
          {/* Shareable Link Card */}
          <div className="bg-gradient-to-br from-brand-600 to-blue-700 text-white p-6 rounded-2xl shadow-md">
            <h3 className="font-bold text-base text-white">Özel Randevu Bağlantınız</h3>
            <p className="text-xs text-brand-100 mt-1 leading-relaxed">
              Müşterileriniz bu link üzerinden 7/24 randevu alabilir. Sosyal medya profillerinize (Instagram Bio, Google Haritalar) ekleyebilirsiniz.
            </p>

            <div className="mt-4 p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-xs font-mono break-all flex items-center justify-between">
              <span>randevo.com/{business?.slug}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href={`/${business?.slug}`}
                target="_blank"
                className="w-full py-2 bg-white text-brand-700 rounded-lg text-xs font-bold text-center hover:bg-brand-50 transition-colors shadow-sm"
              >
                Sayfayı Aç ve Test Et
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Hızlı İşlemler</h3>
            <div className="space-y-2.5">
              <Link
                href="/dashboard/services"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Yeni Hizmet veya Fiyat Ekle</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/dashboard/staff"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Yeni Personel Tanımla</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Çalışma Saatlerini Düzenle</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/dashboard/reports"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Gelir ve İstatistik Raporu</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
