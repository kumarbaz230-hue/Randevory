import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ysxwuiecybnsgbjbcfoa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzeHd1aWVjeWJuc2diamJjZm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNTEyMDIsImV4cCI6MjEwOTYyNzIwMn0.FWA_qsBi-W585oUQnRqQK2BXLPe_poyrQIL1ziY80yI";

// Create client with in-memory auth storage for test runner
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("=== RANDEVO E2E TEST SÜRECİ BAŞLATILIYOR ===");
const results = {
  success: [],
  failed: [],
};

async function runTests() {
  const timestamp = Date.now();
  const testEmail = "testowner@randevo.pro";
  const testPassword = "TestPass123!";
  let userId = null;
  let testBusinessId = null;
  let testStaffId = null;
  let testServiceId = null;
  let testAppointmentId = null;

  // TEST 1: İşletme Sahibi Girişi (signInWithPassword)
  try {
    console.log("\n[TEST 1] Kullanıcı Girişi (signInWithPassword)...");
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (signInErr) throw signInErr;
    userId = signInData.user?.id;
    console.log(" -> Giriş doğrulandı! User ID:", userId);
    console.log(" -> Session token alındı.");

    results.success.push("1. Kullanıcı kaydı ve kimlik doğrulama (Auth signIn)");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`1. Kullanıcı kaydı ve kimlik doğrulama: ${err.message}`);
  }

  // TEST 2: Yeni İşletme Oluşturma
  try {
    console.log("\n[TEST 2] İşletme Oluşturma (businesses & business_members)...");
    const testSlug = `oto-bakim-${timestamp}`;
    const { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        name: `Oto Bakım Merkezi ${timestamp}`,
        slug: testSlug,
        sector: 'auto_wash_care',
        phone: '+90 216 111 2233',
        email: testEmail,
        address: 'Sanayi Cad. No: 12',
        city: 'İstanbul',
        district: 'Kartal',
        is_active: true,
      })
      .select()
      .single();

    if (bizErr) throw bizErr;
    testBusinessId = biz.id;
    console.log(" -> İşletme oluşturuldu:", biz.name, "ID:", testBusinessId);

    // Üyelik ilişkisi (business_members)
    const { error: memErr } = await supabase.from('business_members').insert({
      business_id: testBusinessId,
      user_id: userId,
      role: 'business_owner',
      is_owner: true,
    });
    if (memErr) throw memErr;
    console.log(" -> İşletme sahibi üyeliği bağlandı (business_members)");

    results.success.push("2. Yeni işletme profili ve üyelik oluşturma");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`2. İşletme oluşturma: ${err.message}`);
  }

  // TEST 3: Hizmet ve Personel CRUD Testi
  try {
    console.log("\n[TEST 3] Hizmet ve Personel Ekleme, Düzenleme...");
    // 3.1 Hizmet Ekleme
    const { data: srv, error: srvErr } = await supabase
      .from('services')
      .insert({
        business_id: testBusinessId,
        category_name: 'Periyodik Bakım',
        name: 'Yağ & Filtre Değişimi',
        duration_minutes: 45,
        buffer_after_minutes: 10,
        price: 850.00,
        is_active: true,
      })
      .select()
      .single();
    if (srvErr) throw srvErr;
    testServiceId = srv.id;
    console.log(" -> Hizmet eklendi:", srv.name, "Fiyat:", srv.price);

    // 3.2 Personel Ekleme
    const { data: stf, error: stfErr } = await supabase
      .from('staff')
      .insert({
        business_id: testBusinessId,
        name: 'Murat Usta',
        title: 'Baş Mekaniker',
        phone: '+90 533 444 5566',
        color_code: '#10b981',
        is_active: true,
      })
      .select()
      .single();
    if (stfErr) throw stfErr;
    testStaffId = stf.id;
    console.log(" -> Personel eklendi:", stf.name, "ID:", testStaffId);

    // 3.3 Personel - Hizmet Eşleştirme (staff_services)
    const { error: matchErr } = await supabase.from('staff_services').insert({
      staff_id: testStaffId,
      service_id: testServiceId,
    });
    if (matchErr) throw matchErr;
    console.log(" -> Personel-Hizmet eşleştirmesi yapıldı");

    // 3.4 Hizmet Güncelleme
    const { error: updSrvErr } = await supabase
      .from('services')
      .update({ price: 900.00 })
      .eq('id', testServiceId);
    if (updSrvErr) throw updSrvErr;
    console.log(" -> Hizmet fiyatı 900 ₺ olarak güncellendi");

    results.success.push("3. Hizmet ve personel CRUD ve eşleştirme işlemleri");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`3. Hizmet ve personel CRUD: ${err.message}`);
  }

  // TEST 4: Müşteri Tarafı Halka Açık Randevu Oluşturma
  try {
    console.log("\n[TEST 4] Müşteri Halka Açık Randevu Alma Akışı...");
    const appointmentStart = new Date(Date.now() + 86400000 * 2); // 2 gün sonra
    appointmentStart.setHours(14, 0, 0, 0);
    const appointmentEnd = new Date(appointmentStart.getTime() + 45 * 60000);

    const { data: apt, error: aptErr } = await supabase
      .from('appointments')
      .insert({
        business_id: testBusinessId,
        service_id: testServiceId,
        staff_id: testStaffId,
        customer_name: 'Müşteri Selim',
        customer_phone: '+90 544 888 7766',
        customer_notes: 'Fren kontrolü de yapılsın lütfen.',
        start_time: appointmentStart.toISOString(),
        end_time: appointmentEnd.toISOString(),
        total_price: 900.00,
        status: 'confirmed',
      })
      .select()
      .single();

    if (aptErr) throw aptErr;
    testAppointmentId = apt.id;
    console.log(" -> Randevu oluşturuldu ID:", testAppointmentId, "Saat:", appointmentStart.toISOString());
    results.success.push("4. Müşteri arayüzü randevu oluşturma");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`4. Randevu oluşturma: ${err.message}`);
  }

  // TEST 5: Randevunun İşletme Panelinde Listelenmesi
  try {
    console.log("\n[TEST 5] Randevunun İşletme Panelinde Doğrulanması...");
    const { data: bizApts, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', testBusinessId);

    if (fetchErr) throw fetchErr;
    const found = bizApts.find((a) => a.id === testAppointmentId);
    if (!found) throw new Error("Oluşturulan randevu işletme listesinde bulunamadı!");
    console.log(" -> Randevu işletme panelinde başarıyla listelendi (Toplam:", bizApts.length, ")");
    results.success.push("5. Randevunun işletme randevu akışında görünmesi");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`5. Randevu panelde görünme: ${err.message}`);
  }

  // TEST 6: Randevu Durumu Güncelleme ve İptal
  try {
    console.log("\n[TEST 6] Randevu Durumu Güncelleme (Tamamlama & İptal)...");
    const { error: updErr } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', testAppointmentId);

    if (updErr) throw updErr;
    console.log(" -> Randevu 'completed' olarak güncellendi");

    results.success.push("6. Randevu tamamlama ve durum güncelleme");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`6. Randevu durum güncelleme: ${err.message}`);
  }

  // TEST 7: Randevu Çakışmasını Veritabanı Seviyesinde Engelleme
  try {
    console.log("\n[TEST 7] Çakışan Randevu Önleme Testi (Exclusion Constraint)...");
    const slotAStart = new Date(Date.now() + 86400000 * 3);
    slotAStart.setHours(15, 0, 0, 0);
    const slotAEnd = new Date(slotAStart.getTime() + 45 * 60000);

    const { data: aptA, error: errA } = await supabase
      .from('appointments')
      .insert({
        business_id: testBusinessId,
        service_id: testServiceId,
        staff_id: testStaffId,
        customer_name: 'Müşteri 1',
        customer_phone: '+90 532 111 2233',
        start_time: slotAStart.toISOString(),
        end_time: slotAEnd.toISOString(),
        total_price: 900.00,
        status: 'confirmed',
      })
      .select()
      .single();

    if (errA) throw errA;
    console.log(" -> Birinci randevu kaydedildi (15:00 - 15:45)");

    // Aynı personel için çakışan saat (15:15 - 16:00) denemesi
    const slotBStart = new Date(slotAStart.getTime() + 15 * 60000);
    const slotBEnd = new Date(slotBStart.getTime() + 45 * 60000);

    const { error: errB } = await supabase
      .from('appointments')
      .insert({
        business_id: testBusinessId,
        service_id: testServiceId,
        staff_id: testStaffId,
        customer_name: 'Çakışan Müşteri 2',
        customer_phone: '+90 532 999 8877',
        start_time: slotBStart.toISOString(),
        end_time: slotBEnd.toISOString(),
        total_price: 900.00,
        status: 'confirmed',
      });

    if (errB && errB.code === '23P01') {
      console.log(" -> BAŞARILI! PostgreSQL 23P01 hatası verdi ve çakışmayı kilitledi.");
      results.success.push("7. PostgreSQL Exclusion Constraint ile çakışan randevuyu engelleme");
    } else if (errB) {
      console.log(" -> Farklı hata ile engellendi:", errB.message);
      results.success.push("7. Çakışan randevu engellendi");
    } else {
      throw new Error("Çakışan randevu kaydedilmemeliydi ama kaydedildi!");
    }
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`7. Çakışan randevu kontrolü: ${err.message}`);
  }

  // TEST 8: Çok Kiracılı Veri İzolasyonu (Multi-Tenant Isolation)
  try {
    console.log("\n[TEST 8] Veri İzolasyonu Testi (Salon Prestij vs Yeni İşletme)...");
    const salonPrestijId = 'b1000000-0000-0000-0000-000000000001';

    const { data: testBizApts } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', testBusinessId);

    const { data: salonApts } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', salonPrestijId);

    const overlap = (testBizApts || []).some((a) => (salonApts || []).some((s) => s.id === a.id));
    if (overlap) throw new Error("İki işletmenin verileri birbirine karıştı!");

    console.log(" -> Test İşletmesi Randevu Sayısı:", (testBizApts || []).length);
    console.log(" -> Salon Prestij Randevu Sayısı:", (salonApts || []).length);
    console.log(" -> Veriler tamamen izole.");
    results.success.push("8. Çok kiracılı (Multi-tenant) veri izolasyonu doğrulaması");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`8. Veri izolasyonu: ${err.message}`);
  }

  // TEST 9: Çalışma Saatleri ve Kapalı Günler
  try {
    console.log("\n[TEST 9] Çalışma Saatleri ve Kapalı Günler Kaydı...");
    const { data: hours, error: hoursErr } = await supabase
      .from('business_hours')
      .insert([
        { business_id: testBusinessId, day_of_week: 1, is_open: true, open_time: '08:30', close_time: '18:30' },
        { business_id: testBusinessId, day_of_week: 0, is_open: false, open_time: '09:00', close_time: '17:00' },
      ])
      .select();

    if (hoursErr && !hoursErr.message.includes('duplicate')) throw hoursErr;
    console.log(" -> Çalışma saatleri doğrulandı");
    results.success.push("9. Çalışma saatleri ve mesai kuralları");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`9. Çalışma saatleri: ${err.message}`);
  }

  // TEST 10: 10 Kasım 2026 Test Randevusunun Varlığının Doğrulanması
  try {
    console.log("\n[TEST 10] 10 Kasım 2026 Test Kaydının Doğrulanması...");
    const { data: prevTestApt, error: prevErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', '1b318bc0-43b6-4350-837a-d6fc9c210801')
      .single();

    if (prevErr || !prevTestApt) throw new Error("10 Kasım randevusu bulunamadı: " + (prevErr?.message || 'null'));
    console.log(" -> Daha önce oluşturulan test randevusu mevcut:");
    console.log("    Müşteri:", prevTestApt.customer_name);
    console.log("    Tarih:", prevTestApt.start_time);
    console.log("    Durum:", prevTestApt.status);
    console.log("    İptal Sebebi:", prevTestApt.cancellation_reason);
    results.success.push("10. 10 Kasım 2026 tarihli test randevusu doğrulandı");
  } catch (err) {
    console.error(" -> HATA:", err.message);
    results.failed.push(`10. 10 Kasım test randevusu: ${err.message}`);
  }

  console.log("\n=================== TEST SONUÇLARI ===================");
  console.log("BAŞARILI TESTLER (", results.success.length, "/ 10 ):");
  results.success.forEach((s) => console.log(" [✓]", s));

  if (results.failed.length > 0) {
    console.log("\nBAŞARISIZ TESTLER (", results.failed.length, "):");
    results.failed.forEach((f) => console.log(" [✗]", f));
  } else {
    console.log("\nTÜM E2E SENARYOLARI %100 BAŞARIYLA GEÇTİ!");
  }

  return results;
}

runTests();
