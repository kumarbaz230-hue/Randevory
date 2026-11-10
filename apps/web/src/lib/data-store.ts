import {
  Business,
  Service,
  Staff,
  Appointment,
  Customer,
  WorkingHour,
  ChatMessage,
} from '@/types';

// Varsayılan Haftalık Çalışma Saatleri (09:00 - 19:00, Pazar kapalı)
const defaultWorkingHours: WorkingHour[] = [
  { day_of_week: 1, is_open: true, open_time: '09:00', close_time: '19:00', break_start: '13:00', break_end: '14:00' },
  { day_of_week: 2, is_open: true, open_time: '09:00', close_time: '19:00', break_start: '13:00', break_end: '14:00' },
  { day_of_week: 3, is_open: true, open_time: '09:00', close_time: '19:00', break_start: '13:00', break_end: '14:00' },
  { day_of_week: 4, is_open: true, open_time: '09:00', close_time: '19:00', break_start: '13:00', break_end: '14:00' },
  { day_of_week: 5, is_open: true, open_time: '09:00', close_time: '19:00', break_start: '13:00', break_end: '14:00' },
  { day_of_week: 6, is_open: true, open_time: '10:00', close_time: '18:00', break_start: '13:00', break_end: '13:30' },
  { day_of_week: 0, is_open: false, open_time: '10:00', close_time: '17:00' },
];

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'b-1',
    slug: 'salon-prestij',
    name: 'Salon Prestij – Saç & Sakal Tasarım',
    sector: 'barber',
    description: 'Şehrin kalbinde, modern kesim ve geleneksel tıraş sanatını harmanlayan premium erkek bakım salonu.',
    phone: '+90 212 555 0192',
    email: 'info@salonprestij.com',
    website: 'https://salonprestij.com',
    address: 'Bağdat Caddesi No: 142/A, Kadıköy',
    city: 'İstanbul',
    district: 'Kadıköy',
    subscription_plan: 'pro',
    is_active: true,
    created_at: new Date().toISOString(),
    settings: {
      slot_interval_minutes: 30,
      allow_guest_booking: true,
      min_advance_booking_hours: 1,
      max_advance_booking_days: 21,
      auto_confirm_appointments: true,
      cancellation_deadline_hours: 2,
      currency: 'TL',
    },
  },
  {
    id: 'b-2',
    slug: 'master-auto-care',
    name: 'Master Auto Care – Detailing & Mekanik',
    sector: 'auto_wash_care',
    description: 'Seramik kaplama, pasta cila, periyodik bakım ve detaylı oto kuaför merkezi.',
    phone: '+90 216 444 8820',
    email: 'randevu@masterautocare.com',
    address: 'Atatürk Oto Sanayi Sitesi 2. Kısım No: 54',
    city: 'İstanbul',
    district: 'Maslak',
    subscription_plan: 'standard',
    is_active: true,
    created_at: new Date().toISOString(),
    settings: {
      slot_interval_minutes: 60,
      allow_guest_booking: true,
      min_advance_booking_hours: 2,
      max_advance_booking_days: 14,
      auto_confirm_appointments: true,
      cancellation_deadline_hours: 4,
      currency: 'TL',
    },
  },
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's-1',
    business_id: 'b-1',
    category_name: 'Saç & Sakal',
    name: 'Klasik Saç Kesimi & Yıkama',
    description: 'Kişiye özel saç analizi, yıkama, saç kesimi ve stil fönü.',
    duration_minutes: 30,
    buffer_after_minutes: 5,
    price: 350,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 's-2',
    business_id: 'b-1',
    category_name: 'Saç & Sakal',
    name: 'Sakal Şekillendirme & Sıcak Havlu',
    description: 'Sıcak havlu kompresi, ustura ile sakal hattı çizimi ve sakal yağı bakımı.',
    duration_minutes: 25,
    buffer_after_minutes: 5,
    price: 200,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 's-3',
    business_id: 'b-1',
    category_name: 'Paketler',
    name: 'VIP Prestij Bakım Paketi',
    description: 'Saç kesimi, sakal tıraşı, yüz maskesi, kulak-burun ağda ve baş masajı.',
    duration_minutes: 60,
    buffer_after_minutes: 10,
    price: 650,
    is_active: true,
    sort_order: 3,
  },
  {
    id: 's-4',
    business_id: 'b-1',
    category_name: 'Cilt Bakımı',
    name: 'Detoks Kil Maskesi & Buhar',
    description: 'Gözenek arındırıcı ozon buharı ve organik kil maskesi uygulaması.',
    duration_minutes: 30,
    buffer_after_minutes: 5,
    price: 280,
    is_active: true,
    sort_order: 4,
  },
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'st-1',
    business_id: 'b-1',
    name: 'Ahmet Karaca',
    title: 'Kurucu / Master Stylist',
    phone: '+90 532 100 2030',
    email: 'ahmet@salonprestij.com',
    color_code: '#2563eb', // Blue
    is_active: true,
    assigned_service_ids: ['s-1', 's-2', 's-3', 's-4'],
  },
  {
    id: 'st-2',
    business_id: 'b-1',
    name: 'Mert Yılmaz',
    title: 'Kıdemli Kuaför',
    phone: '+90 535 200 4050',
    email: 'mert@salonprestij.com',
    color_code: '#059669', // Emerald
    is_active: true,
    assigned_service_ids: ['s-1', 's-2', 's-3'],
  },
  {
    id: 'st-3',
    business_id: 'b-1',
    name: 'Caner Demir',
    title: 'Sakal & Bakım Uzmanı',
    phone: '+90 544 300 6070',
    email: 'caner@salonprestij.com',
    color_code: '#d97706', // Amber
    is_active: true,
    assigned_service_ids: ['s-2', 's-4'],
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c-1',
    business_id: 'b-1',
    full_name: 'Burak Özçelik',
    phone: '+90 533 111 2233',
    email: 'burak@example.com',
    notes: 'Kısa yanlar, üstler makasla taranır. Sıcak havlu sever.',
    total_appointments_count: 8,
    total_spent: 2800,
    last_appointment_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'c-2',
    business_id: 'b-1',
    full_name: 'Emre Keskin',
    phone: '+90 542 333 4455',
    email: 'emre@example.com',
    notes: 'Hafta sonu sabah saatlerini tercih eder.',
    total_appointments_count: 4,
    total_spent: 1400,
    last_appointment_date: new Date(Date.now() - 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'c-3',
    business_id: 'b-1',
    full_name: 'Kaan Yıldız',
    phone: '+90 551 777 8899',
    notes: 'VIP paket müşterisi.',
    total_appointments_count: 3,
    total_spent: 1950,
    last_appointment_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

// Bugün ve yarın için gerçekçi örnek randevular
const today = new Date();
const todayYear = today.getFullYear();
const todayMonth = today.getMonth();
const todayDay = today.getDate();

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    business_id: 'b-1',
    service_id: 's-1',
    staff_id: 'st-1',
    customer_name: 'Burak Özçelik',
    customer_phone: '+90 533 111 2233',
    customer_email: 'burak@example.com',
    customer_notes: 'Fön de çekilsin lütfen.',
    start_time: new Date(todayYear, todayMonth, todayDay, 10, 0, 0).toISOString(),
    end_time: new Date(todayYear, todayMonth, todayDay, 10, 30, 0).toISOString(),
    total_price: 350,
    status: 'confirmed',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'apt-2',
    business_id: 'b-1',
    service_id: 's-3',
    staff_id: 'st-2',
    customer_name: 'Kaan Yıldız',
    customer_phone: '+90 551 777 8899',
    start_time: new Date(todayYear, todayMonth, todayDay, 11, 0, 0).toISOString(),
    end_time: new Date(todayYear, todayMonth, todayDay, 12, 0, 0).toISOString(),
    total_price: 650,
    status: 'confirmed',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 'apt-3',
    business_id: 'b-1',
    service_id: 's-2',
    staff_id: 'st-3',
    customer_name: 'Emre Keskin',
    customer_phone: '+90 542 333 4455',
    start_time: new Date(todayYear, todayMonth, todayDay, 14, 0, 0).toISOString(),
    end_time: new Date(todayYear, todayMonth, todayDay, 14, 25, 0).toISOString(),
    total_price: 200,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'apt-4',
    business_id: 'b-1',
    service_id: 's-1',
    staff_id: 'st-1',
    customer_name: 'Deniz Eren',
    customer_phone: '+90 530 999 1122',
    start_time: new Date(todayYear, todayMonth, todayDay + 1, 15, 0, 0).toISOString(),
    end_time: new Date(todayYear, todayMonth, todayDay + 1, 15, 30, 0).toISOString(),
    total_price: 350,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  },
];

/**
 * Tarayıcıda localStorage veya bellek içi (in-memory) veri deposu
 */
class DataStore {
  private businesses: Business[] = [...INITIAL_BUSINESSES];
  private services: Service[] = [...INITIAL_SERVICES];
  private staff: Staff[] = [...INITIAL_STAFF];
  private appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
  private customers: Customer[] = [...INITIAL_CUSTOMERS];
  private workingHours: WorkingHour[] = [...defaultWorkingHours];
  private chatMessages: ChatMessage[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const storedAppointments = localStorage.getItem('randevo_appointments');
        if (storedAppointments) {
          this.appointments = JSON.parse(storedAppointments);
        }
        const storedServices = localStorage.getItem('randevo_services');
        if (storedServices) {
          this.services = JSON.parse(storedServices);
        }
        const storedStaff = localStorage.getItem('randevo_staff');
        if (storedStaff) {
          this.staff = JSON.parse(storedStaff);
        }
        const storedBusiness = localStorage.getItem('randevo_business');
        if (storedBusiness) {
          this.businesses = JSON.parse(storedBusiness);
        }
        const storedCustomers = localStorage.getItem('randevo_customers');
        if (storedCustomers) {
          this.customers = JSON.parse(storedCustomers);
        }
        const storedMessages = localStorage.getItem('randevo_chat_messages');
        if (storedMessages) {
          this.chatMessages = JSON.parse(storedMessages);
        }
      } catch (e) {
        console.error('Storage parse error', e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('randevo_appointments', JSON.stringify(this.appointments));
        localStorage.setItem('randevo_services', JSON.stringify(this.services));
        localStorage.setItem('randevo_staff', JSON.stringify(this.staff));
        localStorage.setItem('randevo_business', JSON.stringify(this.businesses));
        localStorage.setItem('randevo_customers', JSON.stringify(this.customers));
        localStorage.setItem('randevo_chat_messages', JSON.stringify(this.chatMessages));
      } catch (e) {
        console.error('Storage save error', e);
      }
    }
  }

  // İşletme
  getBusinessBySlug(slug: string): Business | undefined {
    return this.businesses.find((b) => b.slug === slug);
  }

  getBusinessById(id: string): Business | undefined {
    return this.businesses.find(
      (b) =>
        b.id === id ||
        (id === 'b1000000-0000-0000-0000-000000000001' && b.id === 'b-1') ||
        (id === 'b-1' && b.id === 'b1000000-0000-0000-0000-000000000001')
    );
  }

  updateBusiness(id: string, updates: Partial<Business>): Business {
    const idx = this.businesses.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.businesses[idx] = { ...this.businesses[idx], ...updates };
      this.saveToStorage();
      return this.businesses[idx];
    }
    throw new Error('İşletme bulunamadı');
  }

  // Çalışma Saatleri
  getWorkingHours(businessId: string): WorkingHour[] {
    return this.workingHours;
  }

  updateWorkingHours(businessId: string, hours: WorkingHour[]): WorkingHour[] {
    this.workingHours = hours;
    return this.workingHours;
  }

  // Hizmetler
  getServices(businessId: string): Service[] {
    return this.services.filter((s) => s.business_id === businessId && s.is_active);
  }

  getAllServices(businessId: string): Service[] {
    return this.services.filter((s) => s.business_id === businessId);
  }

  addService(service: Omit<Service, 'id'>): Service {
    const newService: Service = {
      ...service,
      id: `s-${Date.now()}`,
    };
    this.services.push(newService);
    this.saveToStorage();
    return newService;
  }

  updateService(id: string, updates: Partial<Service>): Service {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.services[idx] = { ...this.services[idx], ...updates };
      this.saveToStorage();
      return this.services[idx];
    }
    throw new Error('Hizmet bulunamadı');
  }

  deleteService(id: string): void {
    this.services = this.services.filter((s) => s.id !== id);
    this.saveToStorage();
  }

  // Personeller
  getStaff(businessId: string): Staff[] {
    return this.staff.filter((st) => st.business_id === businessId && st.is_active);
  }

  getAllStaff(businessId: string): Staff[] {
    return this.staff.filter((st) => st.business_id === businessId);
  }

  addStaff(staffMember: Omit<Staff, 'id'>): Staff {
    const newStaff: Staff = {
      ...staffMember,
      id: `st-${Date.now()}`,
    };
    this.staff.push(newStaff);
    this.saveToStorage();
    return newStaff;
  }

  updateStaff(id: string, updates: Partial<Staff>): Staff {
    const idx = this.staff.findIndex((st) => st.id === id);
    if (idx !== -1) {
      this.staff[idx] = { ...this.staff[idx], ...updates };
      this.saveToStorage();
      return this.staff[idx];
    }
    throw new Error('Personel bulunamadı');
  }

  deleteStaff(id: string): void {
    this.staff = this.staff.filter((st) => st.id !== id);
    this.saveToStorage();
  }

  // Randevular
  getAppointments(businessId: string): Appointment[] {
    return this.appointments.filter((a) => a.business_id === businessId);
  }

  getAppointmentsByDateRange(businessId: string, startDate: Date, endDate: Date): Appointment[] {
    return this.appointments.filter((a) => {
      if (a.business_id !== businessId) return false;
      const t = new Date(a.start_time);
      return t >= startDate && t <= endDate;
    });
  }

  addAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Appointment {
    const newAppointment: Appointment = {
      ...appointment,
      id: `apt-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.appointments.push(newAppointment);

    // Müşteriyi CRM'e ekle veya güncelle
    this.upsertCustomerFromAppointment(newAppointment);

    this.saveToStorage();
    return newAppointment;
  }

  updateAppointmentStatus(id: string, status: Appointment['status'], reason?: string): Appointment {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const prevStatus = this.appointments[idx].status;
      this.appointments[idx] = {
        ...this.appointments[idx],
        status,
        ...(reason ? { cancellation_reason: reason } : {}),
      };

      if (status === 'completed' && prevStatus !== 'completed') {
        const apt = this.appointments[idx];
        const norm = (p: string) => p.replace(/\D/g, '').slice(-10);
        const existingCust = this.customers.find(
          (c) => c.business_id === apt.business_id && norm(c.phone) === norm(apt.customer_phone)
        );
        if (existingCust) {
          existingCust.total_spent = (existingCust.total_spent || 0) + (apt.total_price || 0);
          existingCust.total_appointments_count = (existingCust.total_appointments_count || 0) + 1;
        }
      }
      this.saveToStorage();
      return this.appointments[idx];
    }
    throw new Error('Randevu bulunamadı');
  }

  private upsertCustomerFromAppointment(apt: Appointment) {
    const existing = this.customers.find(
      (c) => c.business_id === apt.business_id && c.phone === apt.customer_phone
    );

    if (existing) {
      if (apt.status === 'completed') {
        existing.total_appointments_count += 1;
        existing.total_spent += (apt.total_price || 0);
      }
      existing.last_appointment_date = apt.start_time;
      if (apt.customer_name) existing.full_name = apt.customer_name;
      if (apt.customer_email) existing.email = apt.customer_email;
    } else {
      this.customers.push({
        id: `c-${Date.now()}`,
        business_id: apt.business_id,
        full_name: apt.customer_name,
        phone: apt.customer_phone,
        email: apt.customer_email,
        notes: apt.customer_notes,
        total_appointments_count: apt.status === 'completed' ? 1 : 0,
        total_spent: apt.status === 'completed' ? (apt.total_price || 0) : 0,
        last_appointment_date: apt.start_time,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Müşteriler
  getCustomers(businessId: string): Customer[] {
    return this.customers.filter((c) => c.business_id === businessId);
  }

  addCustomer(customer: Customer): Customer {
    this.customers.push(customer);
    this.saveToStorage();
    return customer;
  }

  // Canlı Mesajlaşma (Chat)
  getChatMessages(businessId: string, customerPhone?: string): ChatMessage[] {
    const norm = (p: string) => p.replace(/[^0-9]/g, '').slice(-10);
    return this.chatMessages
      .filter((m) => {
        if (m.business_id !== businessId) return false;
        if (customerPhone && norm(m.customer_phone) !== norm(customerPhone)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  addChatMessage(msg: Omit<ChatMessage, 'id' | 'created_at' | 'is_read'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.chatMessages.push(newMsg);
    this.saveToStorage();
    return newMsg;
  }

  markMessagesRead(businessId: string, customerPhone: string, readerType: 'customer' | 'business'): void {
    const norm = (p: string) => p.replace(/[^0-9]/g, '').slice(-10);
    const targetSender = readerType === 'business' ? 'customer' : 'business';
    this.chatMessages = this.chatMessages.map((m) => {
      if (
        m.business_id === businessId &&
        norm(m.customer_phone) === norm(customerPhone) &&
        m.sender_type === targetSender
      ) {
        return { ...m, is_read: true };
      }
      return m;
    });
    this.saveToStorage();
  }
}

// Singleton Instance
export const store = new DataStore();
