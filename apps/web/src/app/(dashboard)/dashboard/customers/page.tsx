'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { repo } from '@/lib/supabase-repository';
import { Customer, Appointment, Business } from '@/types';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  TrendingUp,
  Plus,
  X,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Check,
} from 'lucide-react';

export default function DashboardCustomersPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Customer Form State
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const b = await repo.getActiveBusiness();
    if (b) {
      setBusiness(b);
      const [custs, apts] = await Promise.all([
        repo.getCustomers(b.id),
        repo.getAppointments(b.id),
      ]);
      setCustomers(custs);
      setAppointments(apts);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setModalError('');

    if (!newFullName.trim() || !newPhone.trim()) {
      setModalError('Lütfen ad soyad ve telefon numarasını girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await repo.addCustomer({
        business_id: business.id,
        full_name: newFullName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });

      setShowAddModal(false);
      setNewFullName('');
      setNewPhone('');
      setNewEmail('');
      setNewNotes('');
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Müşteri kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlacklist = async (phone: string, customerName: string) => {
    if (!business) return;
    const clean = repo.normalizePhone(phone);
    const currentList = business.settings?.blacklist_phones || [];
    const isAlreadyBlocked = currentList.map((p) => repo.normalizePhone(p)).includes(clean);

    let nextList: string[];
    let message = '';
    if (isAlreadyBlocked) {
      nextList = currentList.filter((p) => repo.normalizePhone(p) !== clean);
      message = `${customerName} (${phone}) engeli kaldırıldı.`;
    } else {
      if (
        !confirm(
          `${customerName} (${phone}) kara listeye alınsın mı?\nBu numara işletmenizden bir daha randevu alamayacaktır.`
        )
      ) {
        return;
      }
      nextList = [...currentList, phone];
      message = `${customerName} (${phone}) kara listeye alındı!`;
    }

    try {
      const updatedBiz = await repo.updateBusiness(business.id, {
        settings: {
          ...business.settings,
          blacklist_phones: nextList,
        },
      });
      setBusiness(updatedBiz);
      setSuccessToast(message);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      alert('İşlem kaydedilemedi.');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Müşteri Veritabanı (CRM)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İşletmenizden randevu alan tüm müşterilerinizin geçmişi, harcama tutarları ve özel notları.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İsim veya telefon ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Mobile Customer Cards (App-Like Native View) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Kayıtlı müşteri bulunamadı.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const rawPhone = cust.phone.replace(/\D/g, '');
            const cleanPhone = repo.normalizePhone(cust.phone);
            const waNumber = rawPhone.startsWith('0') ? '9' + rawPhone : (rawPhone.startsWith('90') ? rawPhone : '90' + rawPhone);
            const isBlocked = (business?.settings?.blacklist_phones || []).map((p) => repo.normalizePhone(p)).includes(cleanPhone);
            const noShows = appointments.filter((a) => repo.normalizePhone(a.customer_phone) === cleanPhone && a.status === 'no_show').length;
            const completedApts = appointments.filter((a) => repo.normalizePhone(a.customer_phone) === cleanPhone && a.status === 'completed');
            const totalSpentCalculated = completedApts.length > 0 ? completedApts.reduce((sum, a) => sum + (a.total_price || 0), 0) : cust.total_spent;
            const sessionsCount = completedApts.length > 0 ? completedApts.length : cust.total_appointments_count;
            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {cust.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{cust.full_name}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand-700">
                    {sessionsCount} Seans
                  </span>
                </div>

                {cust.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl italic">
                    "{cust.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-500">
                    Toplam: <span className="font-bold text-slate-900">{totalSpentCalculated} ₺</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${cust.phone}`}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                      title="Ara"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </a>
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs hover:bg-emerald-100 flex items-center gap-1"
                      title="WhatsApp"
                    >
                      WP
                    </a>
                    <Link
                      href={`/dashboard/messages?phone=${encodeURIComponent(cust.phone)}&name=${encodeURIComponent(cust.full_name)}`}
                      className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold text-xs flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Mesaj
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Customer List Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Müşteri</th>
                <th className="px-6 py-3.5 font-semibold">İletişim</th>
                <th className="px-6 py-3.5 font-semibold">Toplam Randevu</th>
                <th className="px-6 py-3.5 font-semibold">Toplam Harcama</th>
                <th className="px-6 py-3.5 font-semibold">Son Randevu</th>
                <th className="px-6 py-3.5 font-semibold">Özel Not</th>
                <th className="px-6 py-3.5 font-semibold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Kayıtlı müşteri bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{cust.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-brand-700 font-bold text-xs">
                        {cust.total_appointments_count} Seans
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {cust.total_spent} ₺
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cust.last_appointment_date ? (
                        new Date(cust.last_appointment_date).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {cust.notes ? (
                        <span className="italic">{cust.notes}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/messages?phone=${encodeURIComponent(cust.phone)}&name=${encodeURIComponent(cust.full_name)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold text-xs transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Mesaj Yaz
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal (Bottom sheet on mobile) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92dvh] overflow-y-auto safe-bottom">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Yeni Müşteri Kaydı</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Müşteri Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe Demir"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefon Numarası *</label>
                <input
                  type="tel"
                  required
                  placeholder="Örn: 0532 111 2233"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-posta (Opsiyonel)</label>
                <input
                  type="email"
                  placeholder="Örn: ayse@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Özel Müşteri Notu</label>
                <textarea
                  rows={2}
                  placeholder="Tercihleri, alerjileri veya özel notlar..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
