import { createClient, isSupabaseConfigured } from './supabase/client';
import { store } from './data-store';
import {
  Appointment,
  Business,
  BusinessSector,
  Customer,
  Service,
  Staff,
  WorkingHour,
  SubscriptionPlan,
  Subscription,
  SubscriptionTier,
  ChatMessage,
} from '@/types';

/**
 * RANDEVORY Canlı Veri Katmanı (Supabase & Multi-Tenant PostgreSQL)
 */
export class DataRepository {
  private static instance: DataRepository;

  static getInstance(): DataRepository {
    if (!DataRepository.instance) {
      DataRepository.instance = new DataRepository();
    }
    return DataRepository.instance;
  }

  normalizePhone(phone: string): string {
    return (phone || '').replace(/[^0-9]/g, '').slice(-10);
  }

  normalizeSlug(raw: string): string {
    let decoded = raw || '';
    try {
      decoded = decodeURIComponent(decoded);
    } catch {}
    const trMap: Record<string, string> = {
      ç: 'c',
      Ç: 'c',
      ğ: 'g',
      Ğ: 'g',
      ı: 'i',
      İ: 'i',
      I: 'i',
      ö: 'o',
      Ö: 'o',
      ş: 's',
      Ş: 's',
      ü: 'u',
      Ü: 'u',
    };
    return decoded
      .trim()
      .replace(/[çÇğĞıİIöÖşŞüÜ]/g, (ch) => trMap[ch] || ch)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // --- AKTİF İŞLETME YÖNETİMİ ---
  async getActiveBusiness(): Promise<Business | null> {
    if (!isSupabaseConfigured()) {
      return store.getBusinessById('b-1') || store.getBusinessBySlug('salon-prestij') || null;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Oturum açmış kullanıcının sahip olduğu işletmeyi getir
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id, businesses(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (member?.businesses) {
          const bizObj = Array.isArray(member.businesses) ? member.businesses[0] : member.businesses;
          if (bizObj) return bizObj as unknown as Business;
        }

        // Giriş yapmış kullanıcının henüz bir işletmesi yoksa null döndür
        return null;
      }

      // Oturum yoksa (misafir veya demo) varsayılan örnek işletmeyi getir (Salon Prestij)
      const { data: defaultBiz } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', 'salon-prestij')
        .single();

      if (defaultBiz) return defaultBiz as Business;
    } catch (e) {
      console.warn('getActiveBusiness fallback to store', e);
    }

    return store.getBusinessById('b-1') || null;
  }

  async createBusiness(params: {
    name: string;
    slug: string;
    sector: BusinessSector;
    phone: string;
    email: string;
    address: string;
    city: string;
    district?: string;
    description?: string;
  }): Promise<Business> {
    if (!isSupabaseConfigured()) {
      const newBiz: Business = {
        id: `b-${Date.now()}`,
        name: params.name,
        slug: params.slug,
        sector: params.sector,
        phone: params.phone,
        email: params.email,
        address: params.address,
        city: params.city,
        district: params.district,
        description: params.description || '',
        settings: {
          slot_interval_minutes: 30,
          allow_guest_booking: true,
          min_advance_booking_hours: 1,
          max_advance_booking_days: 30,
          auto_confirm_appointments: true,
          cancellation_deadline_hours: 2,
          currency: 'TRY',
        },
        subscription_plan: 'free',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      return store.updateBusiness(newBiz.id, newBiz);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        name: params.name,
        slug: params.slug,
        sector: params.sector,
        phone: params.phone,
        email: params.email,
        address: params.address,
        city: params.city,
        district: params.district || null,
        description: params.description || null,
        is_active: true,
      })
      .select()
      .single();

    if (bizErr) throw new Error(bizErr.message);

    // Eğer oturum açmış kullanıcı varsa işletme üyesi/sahibi yap
    if (user) {
      await supabase.from('business_members').insert({
        business_id: biz.id,
        user_id: user.id,
        role: 'business_owner',
        is_owner: true,
      });
    }

    // Varsayılan çalışma saatleri tanımla
    const defaultHours = [
      { business_id: biz.id, day_of_week: 1, is_open: true, open_time: '09:00', close_time: '19:00' },
      { business_id: biz.id, day_of_week: 2, is_open: true, open_time: '09:00', close_time: '19:00' },
      { business_id: biz.id, day_of_week: 3, is_open: true, open_time: '09:00', close_time: '19:00' },
      { business_id: biz.id, day_of_week: 4, is_open: true, open_time: '09:00', close_time: '19:00' },
      { business_id: biz.id, day_of_week: 5, is_open: true, open_time: '09:00', close_time: '19:00' },
      { business_id: biz.id, day_of_week: 6, is_open: true, open_time: '10:00', close_time: '18:00' },
      { business_id: biz.id, day_of_week: 0, is_open: false, open_time: '10:00', close_time: '17:00' },
    ];
    await supabase.from('business_hours').insert(defaultHours);

    // Ücretsiz paket aboneliği başlat
    const { data: plan } = await supabase.from('subscription_plans').select('id').eq('tier', 'free').maybeSingle();
    if (plan) {
      await supabase.from('subscriptions').insert({
        business_id: biz.id,
        plan_id: plan.id,
        status: 'active',
      });
    }

    return biz as Business;
  }

  // --- İŞLETME METODLARI ---
  async getBusinessBySlug(slug: string): Promise<Business | null> {
    let decodedSlug = slug || '';
    try {
      decodedSlug = decodeURIComponent(decodedSlug).trim();
    } catch {}
    const cleanSlug = this.normalizeSlug(decodedSlug);

    if (!isSupabaseConfigured()) {
      return (
        store.getBusinessBySlug(decodedSlug) ||
        store.getBusinessBySlug(cleanSlug) ||
        store.getBusinessById('b-1') ||
        null
      );
    }

    const supabase = createClient();

    // 1. Tam eşleşme veya normalize edilmiş slug eşleşmesi dene
    const { data: exactList } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .in('slug', Array.from(new Set([slug, decodedSlug, cleanSlug].filter(Boolean))));

    if (exactList && exactList.length > 0) {
      return exactList[0] as Business;
    }

    // 2. Türkçe karakter / büyük-küçük harf farkı olan kayıtlar için tüm aktif işletmelerden normalize kontrolü yap
    const { data: allActive } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true);

    if (allActive && allActive.length > 0) {
      const matched = allActive.find(
        (b: any) =>
          this.normalizeSlug(b.slug || '') === cleanSlug ||
          this.normalizeSlug(b.name || '') === cleanSlug
      );
      if (matched) return matched as Business;
    }

    return store.getBusinessBySlug(decodedSlug) || store.getBusinessBySlug(cleanSlug) || null;
  }

  async getBusinessById(id: string): Promise<Business | null> {
    if (!isSupabaseConfigured()) {
      return store.getBusinessById(id) || null;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return store.getBusinessById(id) || null;
    }
    return data as Business;
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    const cleanUpdates = { ...updates };
    if (typeof cleanUpdates.slug === 'string' && cleanUpdates.slug.trim()) {
      cleanUpdates.slug = this.normalizeSlug(cleanUpdates.slug);
    }

    if (!isSupabaseConfigured()) {
      return store.updateBusiness(id, cleanUpdates);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('businesses')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Business;
  }

  // --- HİZMET METODLARI ---
  async getServices(businessId: string): Promise<Service[]> {
    if (!isSupabaseConfigured()) {
      return store.getServices(businessId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return store.getServices(businessId);
    }
    return data as Service[];
  }

  async getAllServices(businessId: string): Promise<Service[]> {
    if (!isSupabaseConfigured()) {
      return store.getAllServices(businessId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return store.getAllServices(businessId);
    }
    return data as Service[];
  }

  async addService(service: Omit<Service, 'id'>): Promise<Service> {
    if (!isSupabaseConfigured()) {
      return store.addService(service);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Service;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    if (!isSupabaseConfigured()) {
      return store.updateService(id, updates);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Service;
  }

  async deleteService(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      store.deleteService(id);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        const { error: updateErr } = await supabase
          .from('services')
          .update({ is_active: false })
          .eq('id', id);
        if (updateErr) throw new Error(updateErr.message);
        return;
      }
      throw new Error(error.message);
    }
  }

  // --- PERSONEL METODLARI ---
  async getStaff(businessId: string): Promise<Staff[]> {
    if (!isSupabaseConfigured()) {
      return store.getStaff(businessId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        staff_services (
          service_id
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      return store.getStaff(businessId);
    }

    return data.map((item: any) => ({
      ...item,
      assigned_service_ids: item.staff_services?.map((ss: any) => ss.service_id) || [],
    })) as Staff[];
  }

  async getAllStaff(businessId: string): Promise<Staff[]> {
    if (!isSupabaseConfigured()) {
      return store.getAllStaff(businessId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        staff_services (
          service_id
        )
      `)
      .eq('business_id', businessId);

    if (error || !data || data.length === 0) {
      return store.getAllStaff(businessId);
    }

    return data.map((item: any) => ({
      ...item,
      assigned_service_ids: item.staff_services?.map((ss: any) => ss.service_id) || [],
    })) as Staff[];
  }

  async addStaff(staffMember: Omit<Staff, 'id'>): Promise<Staff> {
    if (!isSupabaseConfigured()) {
      return store.addStaff(staffMember);
    }

    const supabase = createClient();
    const { assigned_service_ids, ...staffData } = staffMember;
    const { data, error } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (assigned_service_ids && assigned_service_ids.length > 0) {
      await supabase.from('staff_services').insert(
        assigned_service_ids.map((sId) => ({
          staff_id: data.id,
          service_id: sId,
        }))
      );
    }

    return { ...data, assigned_service_ids: assigned_service_ids || [] } as Staff;
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    if (!isSupabaseConfigured()) {
      return store.updateStaff(id, updates);
    }

    const supabase = createClient();
    const { assigned_service_ids, ...staffData } = updates;
    const { data, error } = await supabase
      .from('staff')
      .update({ ...staffData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (assigned_service_ids) {
      await supabase.from('staff_services').delete().eq('staff_id', id);
      if (assigned_service_ids.length > 0) {
        await supabase.from('staff_services').insert(
          assigned_service_ids.map((sId) => ({
            staff_id: id,
            service_id: sId,
          }))
        );
      }
    }

    return { ...data, assigned_service_ids: assigned_service_ids || [] } as Staff;
  }

  async deleteStaff(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      store.deleteStaff(id);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        const { error: updateErr } = await supabase
          .from('staff')
          .update({ is_active: false })
          .eq('id', id);
        if (updateErr) throw new Error(updateErr.message);
        return;
      }
      throw new Error(error.message);
    }
  }

  // --- ÇALIŞMA SAATLERİ ---
  async getWorkingHours(businessId: string): Promise<WorkingHour[]> {
    if (!isSupabaseConfigured()) {
      return store.getWorkingHours(businessId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', businessId)
      .order('day_of_week', { ascending: true });

    if (error || !data || data.length === 0) {
      return store.getWorkingHours(businessId);
    }
    return data as WorkingHour[];
  }

  async updateWorkingHours(businessId: string, hours: WorkingHour[]): Promise<WorkingHour[]> {
    if (!isSupabaseConfigured()) {
      return store.updateWorkingHours(businessId, hours);
    }

    const supabase = createClient();
    for (const h of hours) {
      await supabase.from('business_hours').upsert({
        business_id: businessId,
        day_of_week: h.day_of_week,
        is_open: h.is_open,
        open_time: h.open_time,
        close_time: h.close_time,
        break_start: h.break_start || null,
        break_end: h.break_end || null,
      }, { onConflict: 'business_id,day_of_week' });
    }

    return hours;
  }

  // --- RANDEVULAR (ÇAKIŞMA ÖNLEME KISITLI) ---
  async getAppointments(businessId: string): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) {
      return store.getAppointments(businessId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', businessId)
      .order('start_time', { ascending: true });

    if (error || !data) {
      return store.getAppointments(businessId);
    }
    return data as Appointment[];
  }

  async getCustomerAppointmentsByPhone(businessId: string, customerPhone: string): Promise<Appointment[]> {
    const normInput = this.normalizePhone(customerPhone);
    if (normInput.length < 10) return [];

    const all = await this.getAppointments(businessId);
    return all
      .filter((apt) => this.normalizePhone(apt.customer_phone) === normInput)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }

  async cancelCustomerAppointment(
    appointmentId: string,
    customerPhone: string,
    reason = 'Müşteri tarafından online iptal edildi'
  ): Promise<{ success: boolean; error?: string }> {
    const normInput = this.normalizePhone(customerPhone);
    if (normInput.length < 10) {
      return { success: false, error: 'Lütfen geçerli bir telefon numarası girin.' };
    }

    if (!isSupabaseConfigured()) {
      store.updateAppointmentStatus(appointmentId, 'cancelled', reason);
      return { success: true };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('cancel_customer_appointment', {
        p_appointment_id: appointmentId,
        p_customer_phone: customerPhone,
        p_reason: reason,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data && typeof data === 'object' && 'success' in data) {
        return data as { success: boolean; error?: string };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'İptal işlemi sırasında hata oluştu.' };
    }
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    if (!isSupabaseConfigured()) {
      return store.addAppointment(appointment);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        business_id: appointment.business_id,
        service_id: appointment.service_id,
        staff_id: appointment.staff_id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        customer_email: appointment.customer_email || null,
        customer_notes: appointment.customer_notes || null,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        total_price: appointment.total_price,
        status: appointment.status,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23P01') {
        throw new Error('Seçilen saat diliminde personele ait başka bir randevu bulunmaktadır. Lütfen başka bir saat seçin.');
      }
      throw new Error(error.message || 'Randevu kaydedilemedi.');
    }

    // Müşteriyi CRM'e ekle veya güncelle
    try {
      await supabase.from('customers').upsert({
        business_id: appointment.business_id,
        full_name: appointment.customer_name,
        phone: appointment.customer_phone,
        email: appointment.customer_email || null,
        total_appointments_count: 1,
        total_spent: appointment.total_price,
        last_appointment_date: appointment.start_time,
      }, { onConflict: 'business_id,phone' });
    } catch {
      // ignore CRM upsert error
    }

    return data as Appointment;
  }

  async updateAppointmentStatus(id: string, status: Appointment['status'], reason?: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      store.updateAppointmentStatus(id, status, reason);
      return;
    }

    const supabase = createClient();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cancelled') {
      updatePayload.cancelled_at = new Date().toISOString();
      if (reason) updatePayload.cancellation_reason = reason;
    }

    const { error } = await supabase
      .from('appointments')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- CANLI SOHBET / MESAJLAŞMA (CHAT) ---
  async getChatMessages(businessId: string, customerPhone?: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured()) {
      return store.getChatMessages(businessId, customerPhone);
    }

    const supabase = createClient();
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (customerPhone) {
      const norm = this.normalizePhone(customerPhone);
      if (norm.length >= 10) {
        query = query.eq('customer_phone', norm);
      }
    }

    const { data, error } = await query;
    if (error || !data) {
      return store.getChatMessages(businessId, customerPhone);
    }

    return data as ChatMessage[];
  }

  async sendChatMessage(params: {
    business_id: string;
    customer_phone: string;
    customer_name: string;
    sender_type: 'customer' | 'business';
    message: string;
    appointment_id?: string;
  }): Promise<ChatMessage> {
    const normPhone = this.normalizePhone(params.customer_phone);
    if (normPhone.length < 10) {
      throw new Error('Geçerli bir telefon numarası gereklidir.');
    }

    const cleanPayload = {
      business_id: params.business_id,
      customer_phone: normPhone,
      customer_name: params.customer_name.trim() || 'Müşteri',
      sender_type: params.sender_type,
      message: params.message.trim(),
      appointment_id: params.appointment_id || undefined,
    };

    if (!isSupabaseConfigured()) {
      return store.addChatMessage(cleanPayload);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        business_id: cleanPayload.business_id,
        customer_phone: cleanPayload.customer_phone,
        customer_name: cleanPayload.customer_name,
        sender_type: cleanPayload.sender_type,
        message: cleanPayload.message,
        appointment_id: cleanPayload.appointment_id || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Mesaj gönderilemedi.');
    }

    return data as ChatMessage;
  }

  async markMessagesAsRead(
    businessId: string,
    customerPhone: string,
    readerType: 'customer' | 'business'
  ): Promise<void> {
    const normPhone = this.normalizePhone(customerPhone);
    if (normPhone.length < 10) return;

    if (!isSupabaseConfigured()) {
      store.markMessagesRead(businessId, normPhone, readerType);
      return;
    }

    const supabase = createClient();
    const targetSender = readerType === 'business' ? 'customer' : 'business';
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('business_id', businessId)
      .eq('customer_phone', normPhone)
      .eq('sender_type', targetSender)
      .eq('is_read', false);
  }

  async getUnreadBusinessMessagesCount(businessId: string): Promise<number> {
    if (!isSupabaseConfigured()) {
      return store
        .getChatMessages(businessId)
        .filter((m) => m.sender_type === 'customer' && !m.is_read).length;
    }

    const supabase = createClient();
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('sender_type', 'customer')
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  }

  // --- MÜŞTERİLER (CRM) ---
  async getCustomers(businessId: string): Promise<Customer[]> {
    if (!isSupabaseConfigured()) {
      return store.getCustomers(businessId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('total_spent', { ascending: false });

    if (error || !data) {
      return store.getCustomers(businessId);
    }
    return data as Customer[];
  }

  async addCustomer(params: {
    business_id: string;
    full_name: string;
    phone: string;
    email?: string;
    notes?: string;
  }): Promise<Customer> {
    if (!isSupabaseConfigured()) {
      const newCust: Customer = {
        id: `c-${Date.now()}`,
        business_id: params.business_id,
        full_name: params.full_name,
        phone: params.phone,
        email: params.email,
        notes: params.notes,
        total_appointments_count: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
      };
      return store.addCustomer(newCust);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: params.business_id,
        full_name: params.full_name,
        phone: params.phone,
        email: params.email || null,
        notes: params.notes || null,
        total_appointments_count: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- ABONELİK VE LİSANS YÖNETİMİ ---
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (!isSupabaseConfigured()) {
      return [
        {
          id: 'p-free',
          name: 'Ücretsiz Başlangıç',
          tier: 'free',
          price_monthly: 0,
          price_yearly: 0,
          max_staff: 1,
          max_services: 5,
          max_appointments_per_month: 50,
          features: ['Temel Randevu Takvimi', 'Özel İşletme Linki', 'Müşteri Kayıtları'],
        },
        {
          id: 'p-standard',
          name: 'Standart Paket',
          tier: 'standard',
          price_monthly: 399,
          price_yearly: 3990,
          max_staff: 3,
          max_services: 20,
          max_appointments_per_month: 300,
          features: ['3 Personel Yönetimi', 'SMS & E-posta Hatırlatma', 'Gelişmiş Takvim', 'Öncelikli Destek'],
        },
        {
          id: 'p-pro',
          name: 'Profesyonel Paket',
          tier: 'pro',
          price_monthly: 799,
          price_yearly: 7990,
          max_staff: 10,
          max_services: 100,
          max_appointments_per_month: 1500,
          features: ['10 Personel', 'Finans & Gelir Raporları', 'Çoklu Şube Altyapısı', 'Özelleştirilebilir Bildirimler'],
        },
        {
          id: 'p-enterprise',
          name: 'Kurumsal Paket',
          tier: 'enterprise',
          price_monthly: 1499,
          price_yearly: 14990,
          max_staff: 999,
          max_services: 999,
          max_appointments_per_month: 999999,
          features: ['Sınırsız Personel ve Hizmet', 'Özel Entegrasyonlar', 'Özel Müşteri Temsilcisi', 'VIP API Erişimi'],
        },
      ];
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map((p: any) => ({
      ...p,
      price_monthly: parseFloat(p.price_monthly) || 0,
      price_yearly: parseFloat(p.price_yearly) || 0,
      features: Array.isArray(p.features) ? p.features : [],
    })) as SubscriptionPlan[];
  }

  async getBusinessSubscription(businessId: string): Promise<Subscription | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Subscription fetch error:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      plan: data.plan
        ? {
            ...data.plan,
            price_monthly: parseFloat(data.plan.price_monthly) || 0,
            price_yearly: parseFloat(data.plan.price_yearly) || 0,
          }
        : undefined,
    } as Subscription;
  }

  async upgradeSubscription(params: {
    businessId: string;
    tier: SubscriptionTier;
    billingCycle: 'monthly' | 'yearly';
    paymentMethod: {
      cardHolder: string;
      lastFour: string;
      brand?: string;
    };
  }): Promise<{ success: boolean; plan: SubscriptionPlan }> {
    const plans = await this.getSubscriptionPlans();
    const selectedPlan = plans.find((p) => p.tier === params.tier);
    if (!selectedPlan) {
      throw new Error('Seçilen abonelik paketi bulunamadı.');
    }

    if (!isSupabaseConfigured()) {
      return { success: true, plan: selectedPlan };
    }

    const supabase = createClient();
    const now = new Date();
    const endDate = new Date(now);
    if (params.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // 1. İşletmenin paketini güncelle
    const { error: bizError } = await supabase
      .from('businesses')
      .update({
        subscription_plan: params.tier,
        updated_at: now.toISOString(),
      })
      .eq('id', params.businessId);

    if (bizError) throw new Error(bizError.message);

    // 2. Subscriptions tablosuna kayıt oluştur veya güncelle
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          business_id: params.businessId,
          plan_id: selectedPlan.id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        },
        { onConflict: 'business_id' }
      );

    if (subError) {
      await supabase.from('subscriptions').insert({
        business_id: params.businessId,
        plan_id: selectedPlan.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
      });
    }

    return { success: true, plan: selectedPlan };
  }
}

export const repo = DataRepository.getInstance();
