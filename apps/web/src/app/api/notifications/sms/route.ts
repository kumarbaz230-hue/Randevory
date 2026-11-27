import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * RANDEVORY Otomatik SMS & WhatsApp Bildirim Servisi
 * Yalnızca veritabanında doğrulanmış yeni oluşturulmuş veya yeni iptal edilmiş
 * randevular için bildirim tetikler; harici keyfi SMS/WhatsApp gönderimine kapalıdır.
 */

const SMS_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 dk
const SMS_RATE_LIMIT_MAX = 10;
const smsRateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkSmsRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = smsRateBuckets.get(ip);
  if (!entry || now > entry.resetAt) {
    smsRateBuckets.set(ip, { count: 1, resetAt: now + SMS_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= SMS_RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function formatTrPhoneForSms(raw: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return '';
  return `90${last10}`; // 905XXXXXXXXX
}

async function sendViaVatanSms(phone90: string, message: string) {
  const apiId = process.env.VATANSMS_API_ID;
  const apiKey = process.env.VATANSMS_API_KEY;
  const sender = process.env.VATANSMS_SENDER || 'RANDEVORY';

  if (!apiId || !apiKey) return { sent: false, provider: 'vatansms_unconfigured' };

  const res = await fetch('https://api.vatansms.net/api/v1/1toN', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_id: apiId,
      api_key: apiKey,
      sender,
      message_type: 'turkce',
      message,
      phones: [phone90.slice(-10)],
    }),
  });

  const data = await res.json().catch(() => ({}));
  return { sent: res.ok && data?.status === 'success', provider: 'vatansms' };
}

async function sendViaNetgsm(phone90: string, message: string) {
  const usercode = process.env.NETGSM_USERCODE;
  const password = process.env.NETGSM_PASSWORD;
  const msgheader = process.env.NETGSM_MSGHEADER || 'RANDEVORY';

  if (!usercode || !password) return { sent: false, provider: 'netgsm_unconfigured' };

  const url = new URL('https://api.netgsm.com.tr/sms/send/get');
  url.searchParams.set('usercode', usercode);
  url.searchParams.set('password', password);
  url.searchParams.set('gsmno', phone90);
  url.searchParams.set('message', message);
  url.searchParams.set('msgheader', msgheader);
  url.searchParams.set('dil', 'TR');

  const res = await fetch(url.toString(), { method: 'GET' });
  const text = await res.text();
  const ok = text.trim().startsWith('00');
  return { sent: ok, provider: 'netgsm' };
}

async function sendViaIletiMerkezi(phone90: string, message: string) {
  const apiKey = process.env.ILETIMERKEZI_API_KEY;
  const hash = process.env.ILETIMERKEZI_HASH;
  const sender = process.env.ILETIMERKEZI_SENDER || 'RANDEVORY';

  if (!apiKey || !hash) return { sent: false, provider: 'iletimerkezi_unconfigured' };

  const payload = {
    request: {
      authentication: { key: apiKey, hash },
      order: {
        sender,
        sendDateTime: [],
        iys: '0',
        message: {
          text: message,
          receipents: {
            number: [phone90.slice(-10)],
          },
        },
      },
    },
  };

  const res = await fetch('https://api.iletimerkezi.com/v1/send-sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return { sent: res.ok, provider: 'iletimerkezi' };
}

async function sendViaTwilio(phone90: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) return { sent: false, provider: 'twilio_unconfigured' };

  const body = new URLSearchParams({
    To: `+${phone90}`,
    From: from,
    Body: message,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  return { sent: res.ok, provider: 'twilio' };
}

async function sendViaWhatsAppApi(phone90: string, message: string) {
  const greenId = process.env.GREEN_API_ID_INSTANCE;
  const greenToken = process.env.GREEN_API_TOKEN_INSTANCE;
  const greenHost = process.env.GREEN_API_HOST || 'https://api.green-api.com';
  if (greenId && greenToken) {
    const res = await fetch(
      `${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${phone90}@c.us`,
          message,
        }),
      }
    );
    return { sent: res.ok, provider: 'whatsapp_green_api' };
  }

  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;
  if (instanceId && token) {
    const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        to: `+${phone90}`,
        body: message,
      }),
    });
    return { sent: res.ok, provider: 'whatsapp_ultramsg' };
  }

  const callMeBotKey = process.env.CALLMEBOT_API_KEY;
  if (callMeBotKey) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone90}&text=${encodeURIComponent(
      message
    )}&apikey=${callMeBotKey}`;
    const res = await fetch(url);
    return { sent: res.ok, provider: 'whatsapp_callmebot' };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkSmsRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla bildirim isteği. Lütfen daha sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { event, appointmentId, customerPhone } = body || {};

    if (
      (event !== 'appointment_created' && event !== 'appointment_cancelled') ||
      !appointmentId ||
      typeof appointmentId !== 'string' ||
      !customerPhone ||
      typeof customerPhone !== 'string'
    ) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz bildirim isteği.' },
        { status: 400 }
      );
    }

    // Randevu kaydını veritabanından doğrula ve tüm bilgileri yalnızca DB'den al
    const supabase = await createServerSupabaseClient();
    const { data: verified, error: verifyErr } = await supabase.rpc(
      'verify_appointment_for_notification',
      {
        p_appointment_id: appointmentId,
        p_customer_phone: customerPhone,
        p_event: event,
      }
    );

    if (verifyErr || !verified || !(verified as any).valid) {
      return NextResponse.json(
        { success: false, error: 'Doğrulanmış randevu bulunamadı.' },
        { status: 403 }
      );
    }

    const v = verified as any;
    const businessName = String(v.businessName || 'RANDEVORY');
    const businessPhone = String(v.businessPhone || '');
    const businessSlug = String(v.businessSlug || '');
    const verifiedCustomerName = String(v.customerName || 'Müşteri');
    const verifiedCustomerPhone = String(v.customerPhone || '');
    const serviceName = String(v.serviceName || 'Randevu');
    const startTime = v.startTime;
    const totalPrice = v.totalPrice || 0;
    const cancelReason = String(v.cancelReason || 'Belirtilmedi');

    const dateFormatted = startTime
      ? new Date(startTime).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    const bizPhone90 = formatTrPhoneForSms(businessPhone);
    const custPhone90 = formatTrPhoneForSms(verifiedCustomerPhone);

    const businessSmsText =
      event === 'appointment_cancelled'
        ? `[RANDEVORY] RANDEVU IPTALI: ${verifiedCustomerName} (${verifiedCustomerPhone}), ${dateFormatted} tarihli randevusunu iptal etti. Neden: ${cancelReason}`
        : `[RANDEVORY] YENI RANDEVU! Musteri: ${verifiedCustomerName} (${verifiedCustomerPhone}), Hizmet: ${serviceName} (${totalPrice} TL), Tarih: ${dateFormatted}. Isletmem: randevory.com/dashboard`;

    const customerSmsText =
      event === 'appointment_cancelled'
        ? `[${businessName}] Sayin ${verifiedCustomerName}, ${dateFormatted} tarihli randevunuz iptal edilmistir. Yeni randevu icin: randevory.com/${businessSlug}`
        : `[${businessName}] Sayin ${verifiedCustomerName}, ${dateFormatted} tarihli ${serviceName} randevunuz olusturulmustur. Sorgulama/Iptal: randevory.com/${businessSlug}`;

    const results: Array<{ target: string; sent: boolean; provider?: string }> = [];

    const dispatchNotification = async (targetPhone90: string, text: string) => {
      if (!targetPhone90) return { sent: false, provider: 'invalid_phone' };

      const waResult = await sendViaWhatsAppApi(targetPhone90, text);
      if (waResult) return waResult;

      if (process.env.VATANSMS_API_ID && process.env.VATANSMS_API_KEY) {
        return sendViaVatanSms(targetPhone90, text);
      }
      if (process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD) {
        return sendViaNetgsm(targetPhone90, text);
      }
      if (process.env.ILETIMERKEZI_API_KEY && process.env.ILETIMERKEZI_HASH) {
        return sendViaIletiMerkezi(targetPhone90, text);
      }
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        return sendViaTwilio(targetPhone90, text);
      }

      return { sent: false, provider: 'sandbox_ready' };
    };

    if (bizPhone90) {
      results.push({ target: 'business', ...(await dispatchNotification(bizPhone90, businessSmsText)) });
    }

    if (custPhone90) {
      results.push({ target: 'customer', ...(await dispatchNotification(custPhone90, customerSmsText)) });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err) {
    console.error('SMS notification error:', err);
    return NextResponse.json(
      { success: false, error: 'Bildirim tetiklenemedi' },
      { status: 500 }
    );
  }
}
