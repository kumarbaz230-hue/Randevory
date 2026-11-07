import { createClient, isSupabaseConfigured } from './supabase/client';
import { store } from './data-store';
import { Appointment, Business, BusinessSector, Customer, Service, Staff, WorkingHour } from '@/types';

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
    if (!isSupabaseConfigured()) {
      return store.getBusinessBySlug(slug) || store.getBusinessById('b-1') || null;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return store.getBusinessBySlug(slug) || null;
    }
    return data as Business;
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
    if (!isSupabaseConfigured()) {
      return store.updateBusiness(id, updates);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('businesses')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
      // Geçmiş randevusu varsa veri bütünlüğünü bozmamak için pasife al (soft-delete)
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
      // Geçmiş randevusu varsa veri bütünlüğünü bozmamak için pasife al (soft-delete)
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
      store.updateAppointmentStatus(id, status);
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
}

export const repo = DataRepository.getInstance();
