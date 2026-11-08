'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/supabase-repository';
import { Appointment, Service, Staff, Business } from '@/types';
import { BusinessShareAndQrCard } from '@/components/business-qr-modal';
import { createBusinessToCustomerWhatsAppUrl } from '@/lib/whatsapp-helper';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Phone,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

type Filter = 'upcoming' | 'pending' | 'all';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Onaylandı',
  pending: 'Onay Bekliyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  cancelled: 'bg-rose-50 text-rose-600 border border-rose-200',
};

const PAGE_SIZE = 5;

export default function DashboardOverviewPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [filter, setFilter] = useState<Filter>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    setLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (aptId: string, newStatus: Appointment['status']) => {
    await repo.updateAppointmentStatus(aptId, newStatus);
    await loadData();
  };

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  // Metrics
  const { totalRevenue, pendingAppointments, todayAppointments, upcomingList } = useMemo(() => {
    const revenue = appointments
      .filter((a) => a.status === 'confirmed' || a.status === 'completed')
      .reduce((sum, a) => sum + (a.total_price || 0), 0);

    const pending = appointments.filter((a) => a.status === 'pending');
    const todayStr = new Date().toDateString();
    const today = appointments.filter((a) => new Date(a.start_time).toDateString() === todayStr);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const upcoming = appointments.filter(
      (a) =>
        new Date(a.start_time) >= startOfToday &&
        a.status !== 'cancelled' &&
        a.status !== 'completed'
    );

    return {
      totalRevenue: revenue,
      pendingAppointments: pending,
      todayAppointments: today,
      upcomingList: upcoming,
    };
  }, [appointments]);

  const listForFilter = useMemo(() => {
    if (filter === 'pending') return pendingAppointments;
    if (filter === 'upcoming') return upcomingList;
    // Tümü: en yeni düşen randevu en üstte (created_at DESC veya start_time DESC)
    return [...appointments].sort((a, b) => {
      const timeB = new Date(b.created_at || b.start_time).getTime();
      const timeA = new Date(a.created_at || a.start_time).getTime();
      return timeB - timeA;
    });
  }, [filter, pendingAppointments, upcomingList, appointments]);

  const visibleList = listForFilter.slice(0, visibleCount);

  const publicSlug = business?.slug || 'salon-prestij';

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
    setExpandedId(null);
  };

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Yaklaşan', count: upcomingList.length },
    { key: 'pending', label: 'Onay Bekleyen', count: pendingAppointments.length },
    { key: 'all', label: 'Tümü', count: appointments.length },
  ];

  return (
    <div className="space-y-5 lg:space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">İşletme Özeti</span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
            Hoş Geldiniz{business?.name ? `, ${business.name}` : ''}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bugün <span className="font-semibold text-slate-800">{todayAppointments.length} randevunuz</span> var.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <Link
            href="/dashboard/messages"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Mesajlar
          </Link>
          <Link
            href="/dashboard/calendar"
            className="px-3.5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs sm:text-sm hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Takvim
          </Link>
          <Link
            href={`/${publicSlug}`}
            target="_blank"
            className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            Randevu Sayfam <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metric Cards: telefonda 2x2 kompakt */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Bugünkü</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{todayAppointments.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">randevu</div>
        </div>

        <button
          type="button"
          onClick={() => changeFilter('pending')}
          className="text-left bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Onay Bekleyen</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{pendingAppointments.length}</div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">
            {pendingAppointments.length > 0 ? 'Hemen inceleyin' : 'Bekleyen yok'}
          </div>
        </button>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Toplam Ciro</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString('tr-TR')} ₺</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">onaylı + tamamlanan</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Personel</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{staff.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{services.length} hizmet</div>
        </div>
      </div>

      {/* Randevu Akışı + yan kartlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Randevu Akışı</h2>
              <p className="text-xs text-slate-500">Detay ve işlemler için randevuya dokunun</p>
            </div>
            <Link
              href="/dashboard/calendar"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0"
            >
              Takvim <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Filtre sekmeleri */}
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar">
            {filterTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => changeFilter(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-colors ${
                  filter === t.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
                <span
                  className={`px-1.5 rounded-full text-[10px] ${
                    filter === t.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {!loaded ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))
            ) : visibleList.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                {filter === 'pending'
                  ? 'Onay bekleyen randevu yok 🎉'
                  : filter === 'upcoming'
                  ? 'Yaklaşan randevu bulunmuyor.'
                  : 'Henüz kayıtlı randevu bulunmuyor.'}
              </div>
            ) : (
              visibleList.map((apt) => {
                const service = serviceMap.get(apt.service_id);
                const staffMember = staffMap.get(apt.staff_id);
                const aptDate = new Date(apt.start_time);
                const isOpen = expandedId === apt.id;

                return (
                  <div
                    key={apt.id}
                    className={`rounded-xl border transition-all ${
                      isOpen ? 'border-brand-300 bg-brand-50/30 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Kompakt satır (her zaman görünür) */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : apt.id)}
                      className="w-full p-3 flex items-center gap-3 text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: staffMember?.color_code || '#2563eb' }}
                      >
                        {apt.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 truncate">{apt.customer_name}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[apt.status] || STATUS_STYLE.cancelled}`}
                          >
                            {STATUS_LABEL[apt.status] || apt.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">
                            {aptDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}{' '}
                            {aptDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{service?.name || 'Hizmet'}</span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Açılan detay + işlemler */}
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-white border border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Uzman</div>
                            <div className="font-semibold text-slate-800 truncate">{staffMember?.name || 'Belirtilmedi'}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Tutar</div>
                            <div className="font-bold text-slate-900">{apt.total_price} ₺</div>
                          </div>
                          <a
                            href={`tel:${apt.customer_phone}`}
                            className="col-span-2 p-2 rounded-lg bg-white border border-slate-100 flex items-center gap-2 text-slate-700 font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {apt.customer_phone}
                          </a>
                        </div>

                        {apt.status === 'cancelled' && apt.cancellation_reason && (
                          <div className="text-[11px] text-rose-600 font-medium">
                            İptal Nedeni: {apt.cancellation_reason}
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(apt.id, 'confirmed')}
                              className="px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Onayla
                            </button>
                          )}
                          {apt.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(apt.id, 'completed')}
                              className="px-3 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Tamamla
                            </button>
                          )}
                          <a
                            href={createBusinessToCustomerWhatsAppUrl({
                              customerPhone: apt.customer_phone,
                              customerName: apt.customer_name,
                              businessName: business?.name || 'İşletme',
                              businessSlug: publicSlug,
                              businessAddress: business?.address,
                              serviceName: service?.name || 'Randevu Hizmeti',
                              staffName: staffMember?.name,
                              startTime: apt.start_time,
                              totalPrice: apt.total_price,
                              type: apt.status === 'cancelled' ? 'cancelled' : 'confirmed',
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 flex items-center justify-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <Link
                            href={`/dashboard/messages?phone=${encodeURIComponent(apt.customer_phone)}&name=${encodeURIComponent(apt.customer_name)}`}
                            className="px-3 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-brand-600" /> Mesaj
                          </Link>
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(apt.id, 'cancelled')}
                              className="px-3 py-2.5 rounded-lg border border-slate-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> İptal
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {listForFilter.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-3 w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Daha fazla göster ({listForFilter.length - visibleCount} randevu daha)
            </button>
          )}
        </div>

        {/* Quick Links & Business Link + QR Card */}
        <div className="space-y-5 lg:space-y-6">
          <BusinessShareAndQrCard
            businessName={business?.name || 'Salon Prestij'}
            slug={publicSlug}
          />

          {/* Hızlı İşlemler: telefonda 2'li ızgara, bilgisayarda liste */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {[
                { href: '/dashboard/messages', label: 'Mesajlar' },
                { href: '/dashboard/services', label: 'Hizmet / Fiyat Ekle' },
                { href: '/dashboard/staff', label: 'Personel Tanımla' },
                { href: '/dashboard/billing', label: 'Abonelik & Lisans' },
                { href: '/dashboard/settings', label: 'Çalışma Saatleri' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="truncate">{l.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
