-- ==============================================================================
-- RANDEVORY SECURITY HARDENING MIGRATION (RLS, TRIGGERS, RPCs & PRIVILEGES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PRIVATE SCHEMA FOR WEBHOOK VERIFICATION & IDEMPOTENCY
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.webhook_secrets (
  name TEXT PRIMARY KEY,
  secret_sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO private.webhook_secrets (name, secret_sha256)
VALUES ('shopier', 'bdcf3717baea0da2a3c061fe12bfc82bd7e98b6e46ed996bd85d928e252373b6')
ON CONFLICT (name) DO UPDATE SET secret_sha256 = EXCLUDED.secret_sha256;

CREATE TABLE IF NOT EXISTS private.shopier_processed_orders (
  order_id TEXT PRIMARY KEY,
  business_id UUID NOT NULL,
  tier TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION private.verify_shopier_secret(p_secret TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, extensions
AS $$
  SELECT p_secret IS NOT NULL
     AND length(p_secret) > 0
     AND EXISTS (
       SELECT 1
       FROM private.webhook_secrets ws
       WHERE ws.name = 'shopier'
         AND ws.secret_sha256 = encode(extensions.digest(p_secret, 'sha256'), 'hex')
     );
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. PREVENT SUPER ADMIN PRIVILEGE ESCALATION (profiles & handle_new_user)
-- ------------------------------------------------------------------------------
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
    'business_owner'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_uid UUID;
  v_email TEXT;
  v_role TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF v_email = 'kumar.baz230@gmail.com' THEN
    RETURN true;
  END IF;

  SELECT p.role::TEXT
  INTO v_role
  FROM public.profiles p
  WHERE p.id = v_uid;

  RETURN coalesce(v_role = 'super_admin', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.role() <> 'service_role'
       AND current_user NOT IN ('postgres', 'supabase_admin')
       AND NOT public.is_current_user_platform_admin() THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Kullanıcı rolü değiştirilemez.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ------------------------------------------------------------------------------
-- 3. PREVENT CROSS-TENANT BUSINESS TAKEOVER (business_members)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_business_ids(check_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT business_id
  FROM public.business_members
  WHERE user_id = check_user_id
    AND (check_user_id = auth.uid() OR auth.role() = 'service_role');
$$;

CREATE OR REPLACE FUNCTION public.get_user_owned_business_ids(check_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT business_id
  FROM public.business_members
  WHERE user_id = check_user_id
    AND is_owner = TRUE
    AND (check_user_id = auth.uid() OR auth.role() = 'service_role');
$$;

DROP POLICY IF EXISTS "Allow creator to insert first membership" ON public.business_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.business_members;
CREATE POLICY "Owners can manage members"
  ON public.business_members FOR ALL
  TO authenticated
  USING (business_id IN (SELECT public.get_user_owned_business_ids((SELECT auth.uid()))))
  WITH CHECK (business_id IN (SELECT public.get_user_owned_business_ids((SELECT auth.uid()))));

CREATE OR REPLACE FUNCTION public.create_business_with_owner(
  p_name text,
  p_slug text,
  p_sector text,
  p_phone text,
  p_email text,
  p_address text,
  p_city text,
  p_district text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_biz public.businesses%ROWTYPE;
  v_plan_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'İşletme oluşturmak için oturum açmanız gerekmektedir.';
  END IF;

  INSERT INTO public.businesses (
    name, slug, sector, phone, email, address, city, district, description,
    subscription_plan, is_active
  )
  VALUES (
    trim(p_name),
    trim(p_slug),
    p_sector::public.business_sector,
    trim(p_phone),
    NULLIF(trim(coalesce(p_email, '')), ''),
    trim(p_address),
    trim(p_city),
    NULLIF(trim(coalesce(p_district, '')), ''),
    NULLIF(trim(coalesce(p_description, '')), ''),
    'free'::public.subscription_tier,
    TRUE
  )
  RETURNING * INTO v_biz;

  INSERT INTO public.business_members (business_id, user_id, role, is_owner)
  VALUES (v_biz.id, v_uid, 'business_owner'::public.user_role, TRUE);

  INSERT INTO public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
  VALUES
    (v_biz.id, 1, TRUE, '09:00', '19:00'),
    (v_biz.id, 2, TRUE, '09:00', '19:00'),
    (v_biz.id, 3, TRUE, '09:00', '19:00'),
    (v_biz.id, 4, TRUE, '09:00', '19:00'),
    (v_biz.id, 5, TRUE, '09:00', '19:00'),
    (v_biz.id, 6, TRUE, '10:00', '18:00'),
    (v_biz.id, 0, FALSE, '10:00', '17:00');

  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE tier = 'free'::public.subscription_tier
  LIMIT 1;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (business_id, plan_id, status)
    VALUES (v_biz.id, v_plan_id, 'active'::public.subscription_status)
    ON CONFLICT (business_id) DO NOTHING;
  END IF;

  RETURN row_to_json(v_biz)::jsonb;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. PROTECT SUBSCRIPTIONS, PLANS & BAN FIELDS + HARDEN SHOPIER RPCs
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_business_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan)
     OR (NEW.is_active IS DISTINCT FROM OLD.is_active)
     OR (NEW.ban_reason IS DISTINCT FROM OLD.ban_reason) THEN
    IF auth.role() <> 'service_role'
       AND current_user NOT IN ('postgres', 'supabase_admin')
       AND current_setting('app.privileged_business_update', true) <> 'true'
       AND NOT public.is_current_user_platform_admin() THEN
      RAISE EXCEPTION 'Yetkisiz işlem: Paket, aktiflik veya yasak bilgileri doğrudan değiştirilemez.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_business_privileged_columns ON public.businesses;
CREATE TRIGGER trg_protect_business_privileged_columns
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_business_privileged_columns();

DROP POLICY IF EXISTS "Business owners can manage subscriptions" ON public.subscriptions;

CREATE OR REPLACE FUNCTION public.downgrade_my_business_to_free(p_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Oturum gerekli.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = p_business_id AND user_id = auth.uid() AND is_owner = TRUE
  ) THEN
    RAISE EXCEPTION 'Bu işlem için işletme sahibi yetkisi gereklidir.';
  END IF;

  PERFORM set_config('app.privileged_business_update', 'true', true);

  UPDATE public.businesses
  SET subscription_plan = 'free'::public.subscription_tier,
      updated_at = now()
  WHERE id = p_business_id;

  UPDATE public.subscriptions
  SET status = 'canceled'::public.subscription_status,
      cancel_at_period_end = TRUE,
      updated_at = now()
  WHERE business_id = p_business_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_business_subscription_if_needed(p_business_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = p_business_id AND user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  SELECT id, current_period_end, status
  INTO v_sub
  FROM public.subscriptions
  WHERE business_id = p_business_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND AND v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end < now() THEN
    PERFORM set_config('app.privileged_business_update', 'true', true);

    UPDATE public.subscriptions
    SET status = 'past_due'::public.subscription_status,
        updated_at = now()
    WHERE id = v_sub.id;

    UPDATE public.businesses
    SET subscription_plan = 'free'::public.subscription_tier,
        updated_at = now()
    WHERE id = p_business_id AND subscription_plan <> 'free'::public.subscription_tier;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.role() <> 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin')
     AND NOT public.is_current_user_platform_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem.';
  END IF;

  PERFORM set_config('app.privileged_business_update', 'true', true);

  UPDATE public.subscriptions
  SET status = 'past_due'::public.subscription_status,
      updated_at = now()
  WHERE status = 'active'::public.subscription_status
    AND current_period_end < now();

  UPDATE public.businesses b
  SET subscription_plan = 'free'::public.subscription_tier
  WHERE b.subscription_plan <> 'free'::public.subscription_tier
    AND NOT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.business_id = b.id
        AND s.status = 'active'::public.subscription_status
        AND s.current_period_end >= now()
    );
END;
$$;

DROP FUNCTION IF EXISTS public.activate_business_license_admin(uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.activate_business_license_admin(
  p_business_id uuid,
  p_tier text,
  p_billing_cycle text DEFAULT 'monthly',
  p_order_id text DEFAULT NULL,
  p_webhook_secret text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan_id UUID;
  v_period_end TIMESTAMPTZ;
  v_sub_id UUID;
  v_clean_order_id TEXT := NULLIF(trim(coalesce(p_order_id, '')), '');
BEGIN
  IF auth.role() <> 'service_role'
     AND NOT public.is_current_user_platform_admin()
     AND NOT private.verify_shopier_secret(p_webhook_secret) THEN
    RAISE EXCEPTION 'Yetkisiz lisans aktivasyon isteği.';
  END IF;

  IF v_clean_order_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM private.shopier_processed_orders WHERE order_id = v_clean_order_id) THEN
      RETURN jsonb_build_object('success', true, 'already_processed', true, 'order_id', v_clean_order_id);
    END IF;
  END IF;

  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE tier = lower(p_tier)::public.subscription_tier
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan not found: ' || p_tier);
  END IF;

  IF p_billing_cycle = 'yearly' THEN
    v_period_end := now() + INTERVAL '1 year';
  ELSE
    v_period_end := now() + INTERVAL '1 month';
  END IF;

  PERFORM set_config('app.privileged_business_update', 'true', true);

  UPDATE public.businesses
  SET subscription_plan = lower(p_tier)::public.subscription_tier,
      updated_at = now()
  WHERE id = p_business_id;

  SELECT id INTO v_sub_id
  FROM public.subscriptions
  WHERE business_id = p_business_id
  LIMIT 1;

  IF v_sub_id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET plan_id = v_plan_id,
        status = 'active'::public.subscription_status,
        current_period_start = now(),
        current_period_end = v_period_end,
        cancel_at_period_end = false,
        updated_at = now()
    WHERE id = v_sub_id;
  ELSE
    INSERT INTO public.subscriptions (
      business_id, plan_id, status, current_period_start, current_period_end,
      cancel_at_period_end, created_at, updated_at
    ) VALUES (
      p_business_id, v_plan_id, 'active'::public.subscription_status, now(), v_period_end,
      false, now(), now()
    );
  END IF;

  IF v_clean_order_id IS NOT NULL THEN
    INSERT INTO private.shopier_processed_orders (order_id, business_id, tier)
    VALUES (v_clean_order_id, p_business_id, lower(p_tier))
    ON CONFLICT (order_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'business_id', p_business_id,
    'tier', lower(p_tier),
    'period_end', v_period_end
  );
END;
$$;

DROP FUNCTION IF EXISTS public.find_business_by_contact(text, text);
CREATE OR REPLACE FUNCTION public.find_business_by_contact(
  p_email text,
  p_phone text,
  p_webhook_secret text DEFAULT NULL
)
RETURNS TABLE(business_id uuid, business_name text, current_plan public.subscription_tier)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.role() <> 'service_role'
     AND NOT public.is_current_user_platform_admin()
     AND NOT private.verify_shopier_secret(p_webhook_secret) THEN
    RAISE EXCEPTION 'Yetkisiz sorgu.';
  END IF;

  IF p_email IS NOT NULL AND length(trim(p_email)) > 0 THEN
    RETURN QUERY
    SELECT b.id, b.name, b.subscription_plan
    FROM public.businesses b
    WHERE lower(trim(b.email)) = lower(trim(p_email))
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
    SELECT b.id, b.name, b.subscription_plan
    FROM public.businesses b
    JOIN public.business_members bm ON bm.business_id = b.id
    JOIN auth.users u ON u.id = bm.user_id
    WHERE lower(trim(u.email)) = lower(trim(p_email))
    ORDER BY bm.created_at DESC
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  IF p_phone IS NOT NULL AND length(trim(p_phone)) >= 10 THEN
    RETURN QUERY
    SELECT b.id, b.name, b.subscription_plan
    FROM public.businesses b
    WHERE right(regexp_replace(b.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
    LIMIT 1;
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. PROTECT APPOINTMENTS & CHAT PII (ZERO UX IMPACT)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointment" ON public.appointments;

CREATE OR REPLACE FUNCTION public.get_business_busy_slots(
  p_business_id uuid,
  p_from timestamptz DEFAULT (now() - INTERVAL '1 day'),
  p_to timestamptz DEFAULT (now() + INTERVAL '45 days')
)
RETURNS TABLE(
  id uuid,
  business_id uuid,
  staff_id uuid,
  service_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status public.appointment_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT a.id, a.business_id, a.staff_id, a.service_id, a.start_time, a.end_time, a.status
  FROM public.appointments a
  JOIN public.businesses b ON b.id = a.business_id AND b.is_active = TRUE
  WHERE a.business_id = p_business_id
    AND a.status IN ('pending'::public.appointment_status, 'confirmed'::public.appointment_status)
    AND a.start_time >= coalesce(p_from, now() - INTERVAL '1 day')
    AND a.start_time <= coalesce(p_to, now() + INTERVAL '45 days')
  ORDER BY a.start_time ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_appointments_by_phone(
  p_business_id uuid,
  p_customer_phone text
)
RETURNS TABLE(
  id uuid,
  business_id uuid,
  service_id uuid,
  staff_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_notes text,
  start_time timestamptz,
  end_time timestamptz,
  total_price numeric,
  status public.appointment_status,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_norm text := public.normalize_tr_phone(p_customer_phone);
BEGIN
  IF length(v_norm) <> 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    a.id, a.business_id, a.service_id, a.staff_id,
    a.customer_name, a.customer_phone, a.customer_email, a.customer_notes,
    a.start_time, a.end_time, a.total_price, a.status,
    a.cancellation_reason, a.cancelled_at, a.created_at
  FROM public.appointments a
  WHERE a.business_id = p_business_id
    AND public.normalize_tr_phone(a.customer_phone) = v_norm
  ORDER BY
    CASE a.status
      WHEN 'pending'::public.appointment_status THEN 4
      WHEN 'confirmed'::public.appointment_status THEN 3
      WHEN 'completed'::public.appointment_status THEN 2
      ELSE 1
    END DESC,
    coalesce(a.created_at, a.start_time) DESC
  LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.book_public_appointment(
  p_business_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_customer_email text DEFAULT NULL,
  p_customer_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_biz public.businesses%ROWTYPE;
  v_srv public.services%ROWTYPE;
  v_stf public.staff%ROWTYPE;
  v_norm_phone TEXT := public.normalize_tr_phone(p_customer_phone);
  v_blacklist JSONB;
  v_bl_item TEXT;
  v_max_daily INT;
  v_same_day_count INT;
  v_target_status public.appointment_status;
  v_created public.appointments%ROWTYPE;
  v_day_start TIMESTAMPTZ;
  v_day_end TIMESTAMPTZ;
BEGIN
  IF length(trim(coalesce(p_customer_name, ''))) < 2 OR length(p_customer_name) > 120 THEN
    RAISE EXCEPTION 'Lütfen geçerli bir ad soyad girin.';
  END IF;

  IF length(v_norm_phone) <> 10 THEN
    RAISE EXCEPTION 'Lütfen geçerli bir 10 haneli telefon numarası girin.';
  END IF;

  IF p_start_time IS NULL OR p_end_time IS NULL OR p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'Geçersiz randevu zaman aralığı.';
  END IF;

  IF p_start_time < (now() - INTERVAL '30 minutes') THEN
    RAISE EXCEPTION 'Geçmiş tarihli randevu oluşturulamaz.';
  END IF;

  IF (p_end_time - p_start_time) > INTERVAL '8 hours' THEN
    RAISE EXCEPTION 'Randevu süresi izin verilen sınırı aşıyor.';
  END IF;

  SELECT * INTO v_biz FROM public.businesses WHERE id = p_business_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'İşletme bulunamadı veya randevu alımına kapalı.';
  END IF;

  SELECT * INTO v_srv FROM public.services WHERE id = p_service_id AND business_id = p_business_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seçilen hizmet bulunamadı veya aktif değil.';
  END IF;

  SELECT * INTO v_stf FROM public.staff WHERE id = p_staff_id AND business_id = p_business_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seçilen personel bulunamadı veya aktif değil.';
  END IF;

  -- Sunucu tarafı kara liste kontrolü
  v_blacklist := coalesce(v_biz.settings->'blacklist_phones', '[]'::jsonb);
  IF jsonb_typeof(v_blacklist) = 'array' THEN
    FOR v_bl_item IN SELECT jsonb_array_elements_text(v_blacklist) LOOP
      IF public.normalize_tr_phone(v_bl_item) = v_norm_phone THEN
        RAISE EXCEPTION 'Bu telefon numarası işletme tarafından randevu alımına kapatılmıştır.';
      END IF;
    END LOOP;
  END IF;

  -- Sunucu tarafı günlük randevu spam limiti
  v_max_daily := coalesce((v_biz.settings->>'max_daily_bookings_per_phone')::int, 2);
  IF v_max_daily < 1 THEN v_max_daily := 2; END IF;

  v_day_start := date_trunc('day', p_start_time AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
  v_day_end := v_day_start + INTERVAL '1 day';

  SELECT count(*)::int INTO v_same_day_count
  FROM public.appointments a
  WHERE a.business_id = p_business_id
    AND public.normalize_tr_phone(a.customer_phone) = v_norm_phone
    AND a.status IN ('pending'::public.appointment_status, 'confirmed'::public.appointment_status)
    AND a.start_time >= v_day_start
    AND a.start_time < v_day_end;

  IF v_same_day_count >= v_max_daily THEN
    RAISE EXCEPTION 'Aynı gün içerisinde en fazla % aktif randevu oluşturabilirsiniz.', v_max_daily;
  END IF;

  IF coalesce((v_biz.settings->>'auto_confirm_appointments')::boolean, true) = false THEN
    v_target_status := 'pending'::public.appointment_status;
  ELSE
    v_target_status := 'confirmed'::public.appointment_status;
  END IF;

  INSERT INTO public.appointments (
    business_id, service_id, staff_id,
    customer_name, customer_phone, customer_email, customer_notes,
    start_time, end_time, total_price, status
  )
  VALUES (
    p_business_id, p_service_id, p_staff_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    NULLIF(trim(coalesce(p_customer_email, '')), ''),
    NULLIF(left(trim(coalesce(p_customer_notes, '')), 500), ''),
    p_start_time,
    p_end_time,
    v_srv.price,
    v_target_status
  )
  RETURNING * INTO v_created;

  RETURN row_to_json(v_created)::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_appointment_for_notification(
  p_appointment_id uuid,
  p_customer_phone text,
  p_event text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_norm text := public.normalize_tr_phone(p_customer_phone);
  v_row RECORD;
BEGIN
  IF p_appointment_id IS NULL OR length(v_norm) <> 10 THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT
    a.id,
    a.status,
    a.start_time,
    a.total_price,
    a.customer_name,
    a.customer_phone,
    a.cancellation_reason,
    a.created_at,
    a.cancelled_at,
    b.name AS business_name,
    b.phone AS business_phone,
    b.slug AS business_slug,
    s.name AS service_name
  INTO v_row
  FROM public.appointments a
  JOIN public.businesses b ON b.id = a.business_id
  LEFT JOIN public.services s ON s.id = a.service_id
  WHERE a.id = p_appointment_id
    AND public.normalize_tr_phone(a.customer_phone) = v_norm
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF p_event = 'appointment_created' THEN
    IF v_row.created_at < (now() - INTERVAL '5 minutes') THEN
      RETURN jsonb_build_object('valid', false);
    END IF;
  ELSIF p_event = 'appointment_cancelled' THEN
    IF v_row.status <> 'cancelled'::public.appointment_status
       OR v_row.cancelled_at IS NULL
       OR v_row.cancelled_at < (now() - INTERVAL '5 minutes') THEN
      RETURN jsonb_build_object('valid', false);
    END IF;
  ELSE
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'businessName', v_row.business_name,
    'businessPhone', v_row.business_phone,
    'businessSlug', v_row.business_slug,
    'customerName', v_row.customer_name,
    'customerPhone', v_row.customer_phone,
    'serviceName', coalesce(v_row.service_name, 'Randevu'),
    'startTime', v_row.start_time,
    'totalPrice', coalesce(v_row.total_price, 0),
    'cancelReason', coalesce(v_row.cancellation_reason, 'Belirtilmedi')
  );
END;
$$;

-- Chat Messages: drop public dump policy, add exact-phone RPCs
DROP POLICY IF EXISTS "Public can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can insert customer chat messages" ON public.chat_messages;

CREATE POLICY "Public can insert customer chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_type = 'customer'
    AND length(trim(coalesce(message, ''))) > 0
    AND length(message) <= 2000
    AND length(public.normalize_tr_phone(customer_phone)) = 10
  );

CREATE OR REPLACE FUNCTION public.get_customer_chat_messages(
  p_business_id uuid,
  p_customer_phone text
)
RETURNS SETOF public.chat_messages
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_norm text := public.normalize_tr_phone(p_customer_phone);
BEGIN
  IF length(v_norm) <> 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT cm.*
  FROM public.chat_messages cm
  WHERE cm.business_id = p_business_id
    AND public.normalize_tr_phone(cm.customer_phone) = v_norm
  ORDER BY cm.created_at ASC
  LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_customer_chat_read(
  p_business_id uuid,
  p_customer_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_norm text := public.normalize_tr_phone(p_customer_phone);
BEGIN
  IF length(v_norm) <> 10 THEN
    RETURN;
  END IF;

  UPDATE public.chat_messages
  SET is_read = TRUE
  WHERE business_id = p_business_id
    AND public.normalize_tr_phone(customer_phone) = v_norm
    AND sender_type = 'business'
    AND is_read = FALSE;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. PROTECT SUPPORT TICKETS WITH SECRET ACCESS TOKEN
-- ------------------------------------------------------------------------------
ALTER TABLE public.platform_support_tickets
  ADD COLUMN IF NOT EXISTS access_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex');

DROP POLICY IF EXISTS "Anyone can read support tickets" ON public.platform_support_tickets;
DROP POLICY IF EXISTS "Anyone can update support tickets" ON public.platform_support_tickets;
DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.platform_support_tickets;
DROP POLICY IF EXISTS "Platform admin can manage support tickets" ON public.platform_support_tickets;

CREATE POLICY "Platform admin can manage support tickets"
  ON public.platform_support_tickets FOR ALL
  TO authenticated
  USING (public.is_current_user_platform_admin())
  WITH CHECK (public.is_current_user_platform_admin());

CREATE OR REPLACE FUNCTION public.support_create_ticket(
  p_sender_name text,
  p_sender_contact text,
  p_category text,
  p_subject text,
  p_message text,
  p_messages jsonb DEFAULT '[]'::jsonb,
  p_reported_business_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_row public.platform_support_tickets%ROWTYPE;
BEGIN
  INSERT INTO public.platform_support_tickets (
    sender_name, sender_contact, category, subject, message,
    messages, reported_business_slug, status
  )
  VALUES (
    left(coalesce(nullif(trim(p_sender_name), ''), 'Ziyaretçi'), 100),
    left(coalesce(nullif(trim(p_sender_contact), ''), 'Canlı Sohbet'), 120),
    left(coalesce(nullif(trim(p_category), ''), 'support'), 40),
    left(coalesce(nullif(trim(p_subject), ''), 'Destek Talebi'), 160),
    left(coalesce(nullif(trim(p_message), ''), 'Canlı destek talebi'), 2000),
    coalesce(p_messages, '[]'::jsonb),
    NULLIF(trim(coalesce(p_reported_business_slug, '')), ''),
    'open'
  )
  RETURNING * INTO v_row;

  RETURN row_to_json(v_row)::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.support_get_ticket(
  p_ticket_id uuid,
  p_access_token text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_row public.platform_support_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.platform_support_tickets
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT public.is_current_user_platform_admin()
     AND (p_access_token IS NULL OR v_row.access_token <> p_access_token) THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(v_row)::jsonb;
END;
$$;

DROP FUNCTION IF EXISTS public.support_send_user_msg(uuid, text, text);
CREATE OR REPLACE FUNCTION public.support_send_user_msg(
  p_ticket_id uuid,
  p_message text,
  p_image_url text DEFAULT '',
  p_access_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated JSONB;
  v_clean_text TEXT;
  v_row public.platform_support_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.platform_support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destek talebi bulunamadı.';
  END IF;

  IF NOT public.is_current_user_platform_admin()
     AND (p_access_token IS NULL OR v_row.access_token <> p_access_token) THEN
    RAISE EXCEPTION 'Yetkisiz destek talebi erişimi.';
  END IF;

  v_clean_text := left(trim(coalesce(p_message, '')), 2000);
  IF v_clean_text = '' AND coalesce(p_image_url, '') = '' THEN
    RAISE EXCEPTION 'Mesaj veya fotoğraf boş olamaz.';
  END IF;

  IF v_clean_text = '' AND coalesce(p_image_url, '') <> '' THEN
    v_clean_text := '📷 [Fotoğraf Gönderildi]';
  END IF;

  UPDATE public.platform_support_tickets
  SET
    messages = coalesce(messages, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'sender', 'user',
        'text', v_clean_text,
        'image_url', nullif(p_image_url, ''),
        'created_at', now()
      )
    ),
    message = v_clean_text,
    status = 'open'
  WHERE id = p_ticket_id
  RETURNING row_to_json(platform_support_tickets.*)::jsonb INTO v_updated;

  RETURN v_updated;
END;
$$;

DROP FUNCTION IF EXISTS public.support_send_agent_auto_reply(uuid, text, text);
CREATE OR REPLACE FUNCTION public.support_send_agent_auto_reply(
  p_ticket_id uuid,
  p_reply text,
  p_agent_name text DEFAULT 'Müşteri Temsilcisi',
  p_access_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated JSONB;
  v_clean_reply TEXT;
  v_row public.platform_support_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.platform_support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destek talebi bulunamadı.';
  END IF;

  IF NOT public.is_current_user_platform_admin()
     AND (p_access_token IS NULL OR v_row.access_token <> p_access_token) THEN
    RAISE EXCEPTION 'Yetkisiz işlem.';
  END IF;

  IF coalesce(v_row.is_taken_over, false) OR v_row.status = 'closed' THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Ticket taken over or closed');
  END IF;

  v_clean_reply := left(trim(coalesce(p_reply, '')), 2000);
  IF v_clean_reply = '' THEN
    RAISE EXCEPTION 'Cevap metni boş olamaz.';
  END IF;

  UPDATE public.platform_support_tickets
  SET
    messages = coalesce(messages, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'sender', 'admin',
        'agent_name', left(coalesce(nullif(trim(p_agent_name), ''), 'Müşteri Temsilcisi'), 60),
        'text', v_clean_reply,
        'created_at', now()
      )
    ),
    admin_reply = v_clean_reply,
    status = 'answered',
    replied_at = now()
  WHERE id = p_ticket_id
  RETURNING row_to_json(platform_support_tickets.*)::jsonb INTO v_updated;

  RETURN coalesce(v_updated, jsonb_build_object('success', true));
END;
$$;

CREATE OR REPLACE FUNCTION public.support_close_own_ticket(
  p_ticket_id uuid,
  p_access_token text,
  p_badge_message jsonb DEFAULT NULL,
  p_rating_summary text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_row public.platform_support_tickets%ROWTYPE;
  v_updated JSONB;
BEGIN
  SELECT * INTO v_row FROM public.platform_support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destek talebi bulunamadı.';
  END IF;

  IF NOT public.is_current_user_platform_admin()
     AND (p_access_token IS NULL OR v_row.access_token <> p_access_token) THEN
    RAISE EXCEPTION 'Yetkisiz işlem.';
  END IF;

  UPDATE public.platform_support_tickets
  SET
    status = 'closed',
    messages = CASE
      WHEN p_badge_message IS NOT NULL THEN coalesce(messages, '[]'::jsonb) || jsonb_build_array(p_badge_message)
      ELSE messages
    END,
    admin_reply = CASE
      WHEN p_rating_summary IS NOT NULL AND trim(p_rating_summary) <> '' THEN
        CASE
          WHEN coalesce(admin_reply, '') <> '' THEN admin_reply || E'\n\n[Müşteri Değerlendirmesi: ' || left(trim(p_rating_summary), 300) || ']'
          ELSE '[Müşteri Değerlendirmesi: ' || left(trim(p_rating_summary), 300) || ']'
        END
      ELSE admin_reply
    END,
    replied_at = coalesce(replied_at, now())
  WHERE id = p_ticket_id
  RETURNING row_to_json(platform_support_tickets.*)::jsonb INTO v_updated;

  RETURN coalesce(v_updated, jsonb_build_object('success', true));
END;
$$;

CREATE OR REPLACE FUNCTION public.support_close_ticket(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated JSONB;
BEGIN
  IF NOT public.is_current_user_platform_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem.';
  END IF;

  UPDATE public.platform_support_tickets
  SET
    status = 'closed',
    replied_at = coalesce(replied_at, now())
  WHERE id = p_ticket_id
  RETURNING row_to_json(platform_support_tickets.*)::jsonb INTO v_updated;

  RETURN coalesce(v_updated, jsonb_build_object('success', true));
END;
$$;

CREATE OR REPLACE FUNCTION public.support_toggle_takeover(p_ticket_id uuid, p_takeover boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated JSONB;
BEGIN
  IF NOT public.is_current_user_platform_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem.';
  END IF;

  UPDATE public.platform_support_tickets
  SET is_taken_over = p_takeover
  WHERE id = p_ticket_id
  RETURNING row_to_json(platform_support_tickets.*)::jsonb INTO v_updated;

  RETURN coalesce(v_updated, jsonb_build_object('success', true));
END;
$$;

-- Drop unused legacy support overloads
DROP FUNCTION IF EXISTS public.user_send_support_message(uuid, text);
DROP FUNCTION IF EXISTS public.user_send_support_message(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_reply_support_ticket(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_reply_support_ticket(uuid, text, text, text);

-- ------------------------------------------------------------------------------
-- 7. PROTECT REVIEWS TABLES (business_reviews & site_reviews)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update/delete reviews" ON public.business_reviews;
DROP POLICY IF EXISTS "Business members or admin manage reviews" ON public.business_reviews;
CREATE POLICY "Business members or admin manage reviews"
  ON public.business_reviews FOR ALL
  TO authenticated
  USING (
    business_id IN (SELECT public.get_user_business_ids((SELECT auth.uid())))
    OR public.is_current_user_platform_admin()
  )
  WITH CHECK (
    business_id IN (SELECT public.get_user_business_ids((SELECT auth.uid())))
    OR public.is_current_user_platform_admin()
  );

DROP POLICY IF EXISTS "Anyone can update helpful_count" ON public.site_reviews;

CREATE OR REPLACE FUNCTION public.increment_site_review_helpful(p_review_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_count INT;
BEGIN
  UPDATE public.site_reviews
  SET helpful_count = coalesce(helpful_count, 0) + 1
  WHERE id = p_review_id
  RETURNING helpful_count INTO v_new_count;

  RETURN coalesce(v_new_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_site_likes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_count INT;
BEGIN
  UPDATE public.platform_settings
  SET site_likes_count = COALESCE(site_likes_count, 1842) + 1,
      updated_at = NOW()
  WHERE id = 'global'
  RETURNING site_likes_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. TIGHTEN FUNCTION EXECUTE PRIVILEGES (REVOKE UNNECESSARY anon/PUBLIC GRANTS)
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_cancel_appointment(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_grant_license(uuid, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_quick_assist_business(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_business_plan(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_business_status(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_platform_settings(boolean, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.support_send_admin_msg(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.support_close_ticket(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.support_toggle_takeover(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_current_user_platform_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_business_ids(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_owned_business_ids(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_business_with_owner(text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.downgrade_my_business_to_free(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_business_subscription_if_needed(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_and_expire_subscriptions() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sync_customer_on_appointment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_business_privileged_columns() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_cancel_appointment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_license(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_quick_assist_business(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_business_plan(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_business_status(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_platform_settings(boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.support_send_admin_msg(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.support_close_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.support_toggle_takeover(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_business_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_owned_business_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_with_owner(text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.downgrade_my_business_to_free(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_business_subscription_if_needed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_expire_subscriptions() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_business_busy_slots(uuid, timestamptz, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_appointments_by_phone(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_public_appointment(uuid, uuid, uuid, text, text, timestamptz, timestamptz, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_appointment_for_notification(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_chat_messages(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_customer_chat_read(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_create_ticket(text, text, text, text, text, jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_get_ticket(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_send_user_msg(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_send_agent_auto_reply(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_close_own_ticket(uuid, text, jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_site_review_helpful(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_site_likes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_business_license_admin(uuid, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_business_by_contact(text, text, text) TO anon, authenticated;
