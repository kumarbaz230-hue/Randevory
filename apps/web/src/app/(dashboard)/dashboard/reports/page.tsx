'use client';

import React, { useState, useEffect } from 'react';
import { repo } from '@/lib/supabase-repository';
import { Appointment, Service, Staff, Business } from '@/types';
import {
  TrendingUp,
  CalendarCheck,
  Award,
  BarChart3,
  Users,
} from 'lucide-react';

export default function DashboardReportsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  useEffect(() => {
    const load = async () => {
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
        setStaffList(stf);
      }
    };
    load();
  }, []);

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'confirmed'
  ).length;
  const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled').length;
  const completionRate =
    totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 100;

  const totalRevenue = appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + (a.total_price || 0), 0);

  // Popular Services calculation
  const serviceStats = services
    .map((s) => {
      const validApts = appointments.filter(
        (a) => a.service_id === s.id && (a.status === 'confirmed' || a.status === 'completed')
      );
      const count = validApts.length;
      const revenue = validApts.reduce((sum, a) => sum + (a.total_price || s.price), 0);
      return { ...s, count, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // Staff Performance calculation
  const staffStats = staffList
    .map((st) => {
      const staffApts = appointments.filter(
        (a) => a.staff_id === st.id && (a.status === 'confirmed' || a.status === 'completed')
      );
      const count = staffApts.length;
      const revenue = staffApts.reduce((sum, a) => sum + (a.total_price || 0), 0);
      return { ...st, count, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Gelir ve Performans Raporları</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {business?.name || 'İşletmenizin'} ciro gelişimini, popüler hizmetlerini ve uzman verimliliğini analiz edin.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Toplam Gerçekleşen Ciro</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-slate-900">{totalRevenue} ₺</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            Onaylanmış & Tamamlanmış ({completedAppointments} Randevu)
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Randevu Katılım Oranı</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-slate-900">%{completionRate}</div>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            {cancelledAppointments} iptal randevu
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ortalama Sepet Tutarı</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-slate-900">
            {completedAppointments > 0 ? Math.round(totalRevenue / completedAppointments) : 0} ₺
          </div>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">
            Seans başına düşen gelir
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            Hizmet Talebi ve Gelir Dağılımı
          </h2>

          <div className="space-y-4">
            {serviceStats.map((srv) => {
              const percentage = totalRevenue > 0 ? Math.round((srv.revenue / totalRevenue) * 100) : 0;
              return (
                <div key={srv.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="font-bold text-slate-900 text-sm">{srv.name}</span>
                    <span className="font-bold text-slate-900">
                      {srv.revenue} ₺ ({srv.count} Randevu)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            Personel & Uzman Performansı
          </h2>

          <div className="space-y-4">
            {staffStats.map((st) => {
              const percentage = totalRevenue > 0 ? Math.round((st.revenue / totalRevenue) * 100) : 0;
              return (
                <div key={st.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-md text-white font-bold text-[10px] flex items-center justify-center"
                        style={{ backgroundColor: st.color_code || '#2563eb' }}
                      >
                        {st.name.charAt(0)}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{st.name}</span>
                      <span className="text-slate-400">({st.title})</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {st.revenue} ₺ ({st.count} Seans)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: st.color_code || '#2563eb',
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
