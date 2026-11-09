export type UserRole = 'super_admin' | 'business_owner' | 'staff' | 'customer';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type SubscriptionTier = 'free' | 'standard' | 'pro' | 'enterprise';

export type BusinessSector = 
  | 'barber'
  | 'hair_salon'
  | 'beauty_salon'
  | 'cafe_restaurant'
  | 'fitness_pilates'
  | 'activity_gaming'
  | 'auto_wash_care'
  | 'tutoring_education'
  | 'tech_service'
  | 'phone_repair'
  | 'consulting'
  | 'veterinary'
  | 'health_clinic'
  | 'other';

export interface RestaurantTable {
  id: string;
  name: string;
  section: 'bahce' | 'salon' | 'teras' | 'vip';
  capacity: number;
  features?: string[];
  is_active?: boolean;
}

export interface BusinessSettings {
  slot_interval_minutes: number;
  allow_guest_booking: boolean;
  min_advance_booking_hours: number;
  max_advance_booking_days: number;
  auto_confirm_appointments: boolean;
  cancellation_deadline_hours: number;
  currency: string;
  maps_url?: string;
  latitude?: number;
  longitude?: number;
  enable_table_booking?: boolean;
  default_booking_style?: 'service' | 'table';
  custom_tables?: RestaurantTable[];
  loyalty_program?: {
    enabled: boolean;
    target_appointments: number;
    reward_type: 'discount_percent' | 'free_service' | 'custom_gift';
    discount_percent?: number;
    reward_title?: string;
  };
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  sector: BusinessSector;
  description: string;
  logo_url?: string;
  cover_url?: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  district?: string;
  settings: BusinessSettings;
  subscription_plan: SubscriptionTier;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  category_name?: string;
  name: string;
  description?: string;
  duration_minutes: number;
  buffer_after_minutes: number;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export interface WorkingHour {
  day_of_week: number; // 0=Sunday, 1=Monday... 6=Saturday
  is_open: boolean;
  open_time: string; // HH:mm format e.g. "09:00"
  close_time: string; // HH:mm format e.g. "19:00"
  break_start?: string;
  break_end?: string;
}

export interface Staff {
  id: string;
  business_id: string;
  name: string;
  title: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  color_code: string;
  is_active: boolean;
  assigned_service_ids: string[];
  working_hours?: WorkingHour[];
}

export interface Appointment {
  id: string;
  business_id: string;
  service_id: string;
  staff_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_notes?: string;
  internal_notes?: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  table_id?: string;
  table_name?: string;
  guest_count?: number;
  total_price: number;
  status: AppointmentStatus;
  cancellation_reason?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  email?: string;
  notes?: string;
  total_appointments_count: number;
  total_spent: number;
  last_appointment_date?: string;
  created_at: string;
}

export interface TimeSlot {
  time: string; // HH:mm
  isoStartTime: string;
  isoEndTime: string;
  available: boolean;
  staff_id: string;
  staff_name: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price_monthly: number;
  price_yearly: number;
  max_staff: number;
  max_services: number;
  max_appointments_per_month: number;
  features: string[];
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
}


export interface ChatMessage {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string;
  sender_type: 'customer' | 'business';
  message: string;
  appointment_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatConversation {
  customer_phone: string;
  customer_name: string;
  last_message: string;
  last_message_at: string;
  last_sender: 'customer' | 'business';
  unread_count: number;
  messages: ChatMessage[];
}

export interface BusinessReview {
  id: string;
  business_id: string;
  appointment_id?: string;
  customer_name: string;
  customer_phone?: string;
  rating: number; // 1-5
  comment?: string;
  service_name?: string;
  staff_name?: string;
  is_verified: boolean;
  created_at: string;
}

