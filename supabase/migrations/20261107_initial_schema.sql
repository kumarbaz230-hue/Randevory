-- ==============================================================================
-- RANDEVO PLATFORMU - PROFESYONEL VERİTABANI ŞEMASI (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. Gerekli PostgreSQL Eklentileri
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==============================================================================
-- 2. ENUM TİPLERİ
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super_admin', 'business_owner', 'staff', 'customer');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_tier AS ENUM ('free', 'standard', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.business_sector AS ENUM (
        'barber',
        'hair_salon',
        'beauty_salon',
        'auto_wash_care',
        'tutoring_education',
        'tech_service',
        'phone_repair',
        'consulting',
        'veterinary',
        'health_clinic',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 3. KULLANICI PROFİLLERİ (auth.users ile senkronize)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'business_owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. İŞLETMELER (TENANTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- Örn: randevo.com/salon-prestij
    name TEXT NOT NULL,
    sector public.business_sector NOT NULL DEFAULT 'other',
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    settings JSONB NOT NULL DEFAULT '{
        "slot_interval_minutes": 30,
        "allow_guest_booking": true,
        "min_advance_booking_hours": 1,
        "max_advance_booking_days": 30,
        "auto_confirm_appointments": true,
        "cancellation_deadline_hours": 2,
        "currency": "TRY"
    }',
    subscription_plan public.subscription_tier NOT NULL DEFAULT 'free',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- ==============================================================================
-- 5. İŞLETME ÜYELERİ / ÇALIŞANLARI VE YETKİLERİ
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'business_owner',
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_biz ON public.business_members(business_id);

-- ==============================================================================
-- 6. HİZMETLER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_name TEXT DEFAULT 'Genel',
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    buffer_after_minutes INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id);

-- ==============================================================================
-- 7. PERSONEL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    title TEXT DEFAULT 'Uzman',
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    color_code TEXT DEFAULT '#2563eb',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_business ON public.staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_user ON public.staff(user_id);

-- Personelin verebildiği hizmetler
CREATE TABLE IF NOT EXISTS public.staff_services (
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    PRIMARY KEY(staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_services_srv ON public.staff_services(service_id);

-- ==============================================================================
-- 8. MÜŞTERİLER (CRM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    notes TEXT,
    total_appointments_count INT NOT NULL DEFAULT 0,
    total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    last_appointment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers(user_id);

-- ==============================================================================
-- 9. ÇALIŞMA SAATLERİ (business_hours) & KAPALI GÜNLER (business_closures)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    open_time TIME NOT NULL DEFAULT '09:00',
    close_time TIME NOT NULL DEFAULT '19:00',
    break_start TIME DEFAULT '13:00',
    break_end TIME DEFAULT '14:00',
    UNIQUE(business_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_business_hours_biz ON public.business_hours(business_id);

CREATE TABLE IF NOT EXISTS public.business_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_closures_biz ON public.business_closures(business_id);

-- ==============================================================================
-- 10. RANDEVULAR & VERİTABANI SEVİYESİ ÇAKIŞMA ÖNLEME KISITI
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status public.appointment_status NOT NULL DEFAULT 'confirmed',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_appointment_time_range CHECK (end_time > start_time),

    -- ÇAKIŞMA KISITI: Aynı personele aynı anda çakışan ve iptal edilmemiş randevu verilemez
    CONSTRAINT prevent_double_booking EXCLUDE USING gist (
        staff_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status IN ('pending', 'confirmed'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_business_dates ON public.appointments(business_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_dates ON public.appointments(staff_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);

-- ==============================================================================
-- 11. ABONELİK PAKETLERİ VE ABONELİKLER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier public.subscription_tier UNIQUE NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    max_staff INT NOT NULL DEFAULT 1,
    max_services INT NOT NULL DEFAULT 10,
    max_appointments_per_month INT NOT NULL DEFAULT 100,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status public.subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_biz ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan_id);

-- Varsayılan Paket Tohum Verileri
INSERT INTO public.subscription_plans (name, tier, price_monthly, price_yearly, max_staff, max_services, max_appointments_per_month, features)
VALUES 
('Ücretsiz Başlangıç', 'free', 0.00, 0.00, 1, 5, 50, '["Temel Randevu Takvimi", "Özel İşletme Linki", "Müşteri Kayıtları"]'::jsonb),
('Standart', 'standard', 399.00, 3990.00, 3, 20, 300, '["3 Personel Yönetimi", "SMS & E-posta Hatırlatma", "Gelişmiş Takvim", "Öncelikli Destek"]'::jsonb),
('Profesyonel', 'pro', 799.00, 7990.00, 10, 100, 1500, '["10 Personel", "Finans & Gelir Raporları", "Çoklu Şube Altyapısı", "Özelleştirilebilir Bildirimler"]'::jsonb),
('Kurumsal', 'enterprise', 1499.00, 14990.00, 999, 999, 999999, '["Sınırsız Personel ve Hizmet", "Özel Entegrasyonlar", "Özel Müşteri Temsilcisi", "VIP API Erişimi"]'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- ==============================================================================
-- 12. OTOMATİK AUTH TRİGGER'LARI
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'business_owner'::public.user_role)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 13. GÜVENLİK VE ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 13.1. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING ((SELECT auth.uid()) = id);

-- 13.2. BUSINESSES POLICIES
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
CREATE POLICY "Public can view active businesses"
    ON public.businesses FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Members can view their business" ON public.businesses;
CREATE POLICY "Members can view their business"
    ON public.businesses FOR SELECT
    USING (id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Owners can update their business" ON public.businesses;
CREATE POLICY "Owners can update their business"
    ON public.businesses FOR UPDATE
    USING (id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid()) AND is_owner = TRUE));

DROP POLICY IF EXISTS "Authenticated users can create a business" ON public.businesses;
CREATE POLICY "Authenticated users can create a business"
    ON public.businesses FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 13.3. BUSINESS_MEMBERS POLICIES
DROP POLICY IF EXISTS "Members can view members of their business" ON public.business_members;
CREATE POLICY "Members can view members of their business"
    ON public.business_members FOR SELECT
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Owners can manage members" ON public.business_members;
CREATE POLICY "Owners can manage members"
    ON public.business_members FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid()) AND is_owner = TRUE));

DROP POLICY IF EXISTS "Allow creator to insert first membership" ON public.business_members;
CREATE POLICY "Allow creator to insert first membership"
    ON public.business_members FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- 13.4. SERVICES POLICIES
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
    ON public.services FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Business members manage services" ON public.services;
CREATE POLICY "Business members manage services"
    ON public.services FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

-- 13.5. STAFF & STAFF_SERVICES POLICIES
DROP POLICY IF EXISTS "Public can view active staff" ON public.staff;
CREATE POLICY "Public can view active staff"
    ON public.staff FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Business members manage staff" ON public.staff;
CREATE POLICY "Business members manage staff"
    ON public.staff FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Public can view staff services" ON public.staff_services;
CREATE POLICY "Public can view staff services"
    ON public.staff_services FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Business members manage staff services" ON public.staff_services;
CREATE POLICY "Business members manage staff services"
    ON public.staff_services FOR ALL
    USING (staff_id IN (
        SELECT id FROM public.staff WHERE business_id IN (
            SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())
        )
    ));

-- 13.6. BUSINESS_HOURS & CLOSURES POLICIES
DROP POLICY IF EXISTS "Public can view business hours" ON public.business_hours;
CREATE POLICY "Public can view business hours"
    ON public.business_hours FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Business members manage business hours" ON public.business_hours;
CREATE POLICY "Business members manage business hours"
    ON public.business_hours FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Public can view closures" ON public.business_closures;
CREATE POLICY "Public can view closures"
    ON public.business_closures FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Business members manage closures" ON public.business_closures;
CREATE POLICY "Business members manage closures"
    ON public.business_closures FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

-- 13.7. CUSTOMERS POLICIES (CRM İZOLASYONU)
DROP POLICY IF EXISTS "Business members view and manage their customers" ON public.customers;
CREATE POLICY "Business members view and manage their customers"
    ON public.customers FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

-- 13.8. APPOINTMENTS POLICIES (RANDEVU GÜVENLİĞİ)
DROP POLICY IF EXISTS "Public can insert appointment" ON public.appointments;
CREATE POLICY "Public can insert appointment"
    ON public.appointments FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Business members manage appointments" ON public.appointments;
CREATE POLICY "Business members manage appointments"
    ON public.appointments FOR ALL
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Customers can view their own appointments" ON public.appointments;
CREATE POLICY "Customers can view their own appointments"
    ON public.appointments FOR SELECT
    USING (customer_id = (SELECT auth.uid()));

-- 13.9. SUBSCRIPTION POLICIES
DROP POLICY IF EXISTS "Public can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Business members view their subscription" ON public.subscriptions;
CREATE POLICY "Business members view their subscription"
    ON public.subscriptions FOR SELECT
    USING (business_id IN (SELECT business_id FROM public.business_members WHERE user_id = (SELECT auth.uid())));

-- ==============================================================================
-- 14. BAŞLANGIÇ İŞLETME TOHUM VERİLERİ (SEED DATA)
-- ==============================================================================
INSERT INTO public.businesses (id, slug, name, sector, description, phone, email, address, city, district, subscription_plan, is_active)
VALUES (
    'b1000000-0000-0000-0000-000000000001',
    'salon-prestij',
    'Salon Prestij – Saç & Sakal Tasarım',
    'barber',
    'Şehrin kalbinde, modern kesim ve geleneksel tıraş sanatını harmanlayan premium erkek bakım salonu.',
    '+90 212 555 0192',
    'info@salonprestij.com',
    'Bağdat Caddesi No: 142/A, Kadıköy',
    'İstanbul',
    'Kadıköy',
    'pro',
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Hizmetler
INSERT INTO public.services (id, business_id, category_name, name, description, duration_minutes, buffer_after_minutes, price, sort_order)
VALUES
    ('s1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Saç & Sakal', 'Klasik Saç Kesimi & Yıkama', 'Kişiye özel saç analizi, yıkama, saç kesimi ve stil fönü.', 30, 5, 350.00, 1),
    ('s1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Saç & Sakal', 'Sakal Şekillendirme & Sıcak Havlu', 'Sıcak havlu kompresi, ustura ile sakal hattı çizimi ve sakal yağı bakımı.', 25, 5, 200.00, 2),
    ('s1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Paketler', 'VIP Prestij Bakım Paketi', 'Saç kesimi, sakal tıraşı, yüz maskesi, kulak-burun ağda ve baş masajı.', 60, 10, 650.00, 3),
    ('s1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Cilt Bakımı', 'Detoks Kil Maskesi & Buhar', 'Gözenek arındırıcı ozon buharı ve organik kil maskesi uygulaması.', 30, 5, 280.00, 4)
ON CONFLICT (id) DO NOTHING;

-- Personeller
INSERT INTO public.staff (id, business_id, name, title, phone, email, color_code, is_active)
VALUES
    ('st000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Ahmet Karaca', 'Kurucu / Master Stylist', '+90 532 100 2030', 'ahmet@salonprestij.com', '#2563eb', TRUE),
    ('st000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Mert Yılmaz', 'Kıdemli Kuaför', '+90 535 200 4050', 'mert@salonprestij.com', '#059669', TRUE),
    ('st000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Caner Demir', 'Sakal & Bakım Uzmanı', '+90 544 300 6070', 'caner@salonprestij.com', '#d97706', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Personel Hizmet Eşleştirmeleri
INSERT INTO public.staff_services (staff_id, service_id)
VALUES
    ('st000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001'),
    ('st000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002'),
    ('st000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000003'),
    ('st000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000004'),
    ('st000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000001'),
    ('st000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000002'),
    ('st000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000003'),
    ('st000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000002'),
    ('st000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Çalışma Saatleri (1: Pazartesi ... 6: Cumartesi açık, 0: Pazar kapalı)
INSERT INTO public.business_hours (business_id, day_of_week, is_open, open_time, close_time, break_start, break_end)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 1, TRUE, '09:00', '19:00', '13:00', '14:00'),
    ('b1000000-0000-0000-0000-000000000001', 2, TRUE, '09:00', '19:00', '13:00', '14:00'),
    ('b1000000-0000-0000-0000-000000000001', 3, TRUE, '09:00', '19:00', '13:00', '14:00'),
    ('b1000000-0000-0000-0000-000000000001', 4, TRUE, '09:00', '19:00', '13:00', '14:00'),
    ('b1000000-0000-0000-0000-000000000001', 5, TRUE, '09:00', '19:00', '13:00', '14:00'),
    ('b1000000-0000-0000-0000-000000000001', 6, TRUE, '10:00', '18:00', '13:00', '13:30'),
    ('b1000000-0000-0000-0000-000000000001', 0, FALSE, '10:00', '17:00', NULL, NULL)
ON CONFLICT (business_id, day_of_week) DO NOTHING;
