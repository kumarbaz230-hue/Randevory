'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { store } from '@/lib/data-store';
import { repo } from '@/lib/supabase-repository';
import { Appointment, Service, Staff, Business } from '@/types';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Check,
  X,
  Phone,
  Scissors,
  CheckCircle,
} from 'lucide-react';

export default function DashboardCalendarPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Selected date for daily/weekly view
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Modal for new appointment or detail
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAptDetail, setSelectedAptDetail] = useState<Appointment | null>(null);

  // New appointment form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newStaffId, setNewStaffId] = useState('');
  const [newTime, setNewTime] = useState('10:00');

  const loadData = async () => {
    const b = await repo.getActiveBusiness();
    if (b) {
      setBusiness(b);
      const [apts, s, st] = await Promise.all([
        repo.getAppointments(b.id),
        repo.getServices(b.id),
        repo.getStaff(b.id),
      ]);
      setAppointments(apts);
      setServices(s);
      if (s.length > 0 && !newServiceId) setNewServiceId(s[0].id);
      setStaffList(st);
      if (st.length > 0 && !newStaffId) setNewStaffId(st[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrevDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() - (viewMode === 'day' ? 1 : 7));
    setCurrentDate(next);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + (viewMode === 'day' ? 1 : 7));
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Appointments for current date
  const dayAppointments = useMemo(() => {
    const dateStr = currentDate.toDateString();
    return appointments.filter((a) => {
      if (selectedStaffFilter !== 'all' && a.staff_id !== selectedStaffFilter) return false;
      const aptDate = new Date(a.start_time).toDateString();
      return aptDate === dateStr;
    });
  }, [appointments, currentDate, selectedStaffFilter]);

  // Hourly timeline from 09:00 to 19:00
  const hours = Array.from({ length: 11 }, (_, i) => i + 9);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newServiceId || !newStaffId || !newCustName || !newCustPhone) return;

    const s = services.find((x) => x.id === newServiceId);
    if (!s) return;

    const [h, m] = newTime.split(':').map(Number);
    const start = new Date(currentDate);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + s.duration_minutes * 60000);

    try {
      await repo.createAppointment({
        business_id: business.id,
        service_id: newServiceId,
        staff_id: newStaffId,
        customer_name: newCustName,
        customer_phone: newCustPhone,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        total_price: s.price,
        status: 'confirmed',
      });

      setShowAddModal(false);
      setNewCustName('');
      setNewCustPhone('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Randevu kaydedilemedi.');
    }
  };

  const handleStatusChange = async (aptId: string, status: Appointment['status']) => {
    await repo.updateAppointmentStatus(aptId, status);
    await loadData();
    if (selectedAptDetail?.id === aptId) {
      setSelectedAptDetail(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
            >
              Bugün
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            {currentDate.toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              weekday: 'long',
            })}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Staff Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Tüm Personeller ({staffList.length})</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add appointment button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Manuel Randevu Ekle
          </button>
        </div>
      </div>

      {/* Daily Time Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Saat</span>
          <span>Bu Güne Ait Randevular ({dayAppointments.length})</span>
        </div>

        <div className="divide-y divide-slate-100">
          {hours.map((hour) => {
            const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;

            // Appointments matching this hour
            const slotAppointments = dayAppointments.filter((a) => {
              const start = new Date(a.start_time);
              return start.getHours() === hour;
            });

            return (
              <div key={hour} className="flex min-h-[72px] hover:bg-slate-50/50 transition-colors">
                {/* Time Column */}
                <div className="w-20 sm:w-24 p-3 text-xs font-semibold text-slate-400 border-r border-slate-100 shrink-0 text-center flex items-start justify-center pt-3">
                  {hourFormatted}
                </div>

                {/* Appointments in slot */}
                <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
                  {slotAppointments.length === 0 ? (
                    <div className="text-xs text-slate-300 italic px-2">Randevu yok</div>
                  ) : (
                    slotAppointments.map((apt) => {
                      const service = services.find((s) => s.id === apt.service_id);
                      const staffMember = staffList.find((s) => s.id === apt.staff_id);
                      const aptDate = new Date(apt.start_time);
                      const timeStr = aptDate.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={apt.id}
                          onClick={() => setSelectedAptDetail(apt)}
                          className="cursor-pointer p-3 rounded-xl border text-left shadow-sm hover:shadow transition-all min-w-[220px] max-w-sm"
                          style={{
                            borderLeftWidth: '5px',
                            borderLeftColor: staffMember?.color_code || '#2563eb',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {apt.customer_name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {timeStr}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 truncate">
                            {service?.name} ({apt.total_price} ₺)
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                            <span>Uzman: {staffMember?.name}</span>
                            <span
                              className={`font-semibold capitalize ${
                                apt.status === 'confirmed'
                                  ? 'text-emerald-600'
                                  : apt.status === 'pending'
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAptDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Randevu Detayı</h3>
              <button
                onClick={() => setSelectedAptDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Müşteri:</span>
                <span className="font-bold text-slate-900">{selectedAptDetail.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Telefon:</span>
                <a href={`tel:${selectedAptDetail.customer_phone}`} className="font-medium text-brand-600 hover:underline">
                  {selectedAptDetail.customer_phone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hizmet:</span>
                <span className="font-medium text-slate-900">
                  {services.find((s) => s.id === selectedAptDetail.service_id)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Personel:</span>
                <span className="font-medium text-slate-900">
                  {staffList.find((st) => st.id === selectedAptDetail.staff_id)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zaman:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(selectedAptDetail.start_time).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tutar:</span>
                <span className="font-bold text-brand-600">{selectedAptDetail.total_price} ₺</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Durum:</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 uppercase">
                  {selectedAptDetail.status}
                </span>
              </div>
              {selectedAptDetail.customer_notes && (
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-200">
                  <span className="font-semibold block text-slate-700">Müşteri Notu:</span>
                  {selectedAptDetail.customer_notes}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => handleStatusChange(selectedAptDetail.id, 'cancelled')}
                className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50"
              >
                İptal Et
              </button>
              <div className="flex gap-2">
                {selectedAptDetail.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(selectedAptDetail.id, 'completed')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                  >
                    Tamamlandı Olarak İşaretle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Manuel Randevu Oluştur</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Müşteri Adı Soyadı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Güler"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon Numarası</label>
                <input
                  type="tel"
                  required
                  placeholder="Örn: 0532 123 4567"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hizmet</label>
                  <select
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.price} ₺)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Personel</label>
                  <select
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Saat</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                >
                  Randevuyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
