import { NextRequest, NextResponse } from 'next/server';

/**
 * RANDEVORY Otomatik SMS Bildirim Servisi
 * Desteklenen Sağlayıcılar:
 * 1. Netgsm (NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER)
 * 2. İleti Merkezi (ILETIMERKEZI_API_KEY, ILETIMERKEZI_HASH, ILETIMERKEZI_SENDER)
 * 3. Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)
 */

function formatTrPhoneForSms(raw: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return '';
  return `90${last10}`; // 905XXXXXXXXX
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
  // Netgsm success codes start with "00"
  const ok = text.trim().startsWith('00');
  return { sent: ok, provider: 'netgsm', response: text.trim() };
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

  const data = await res.json().catch(() => ({}));
  return { sent: res.ok, provider: 'iletimerkezi', response: data };
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

  const data = await res.json().catch(() => ({}));
  return { sent: res.ok, provider: 'twilio', response: data?.sid };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      event, // 'appointment_created' | 'appointment_cancelled'
      businessName,
      businessPhone,
      businessSlug,
      customerName,
      customerPhone,
      serviceName,
      startTime,
      totalPrice,
      cancelReason,
    } = body;

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
    const custPhone90 = formatTrPhoneForSms(customerPhone);

    // 1. İşletme Sahibine Gidecek SMS Metni
    const businessSmsText =
      event === 'appointment_cancelled'
        ? `[RANDEVORY] RANDEVU IPTALI: ${customerName} (${customerPhone}), ${dateFormatted} tarihli randevusunu iptal etti. Neden: ${cancelReason || 'Belirtilmedi'}`
        : `[RANDEVORY] YENI RANDEVU! Musteri: ${customerName} (${customerPhone}), Hizmet: ${serviceName || 'Randevu'} (${totalPrice || 0} TL), Tarih: ${dateFormatted}. Panel: randevory.com/dashboard`;

    // 2. Müşteriye Gidecek SMS Metni
    const customerSmsText =
      event === 'appointment_cancelled'
        ? `[${businessName}] Sayin ${customerName}, ${dateFormatted} tarihli randevunuz iptal edilmistir. Yeni randevu icin: randevory.com/${businessSlug || ''}`
        : `[${businessName}] Sayin ${customerName}, ${dateFormatted} tarihli ${serviceName || ''} randevunuz olusturulmustur. Sorgulama/Iptal: randevory.com/${businessSlug || ''}`;

    const results: any[] = [];

    // Sırasıyla yapılandırılmış SMS sağlayıcısını dene (Netgsm -> İleti Merkezi -> Twilio)
    const dispatchSms = async (targetPhone90: string, text: string) => {
      if (!targetPhone90) return { sent: false, reason: 'invalid_phone' };

      if (process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD) {
        return sendViaNetgsm(targetPhone90, text);
      }
      if (process.env.ILETIMERKEZI_API_KEY && process.env.ILETIMERKEZI_HASH) {
        return sendViaIletiMerkezi(targetPhone90, text);
      }
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        return sendViaTwilio(targetPhone90, text);
      }

      return {
        sent: false,
        mode: 'sandbox_ready',
        preview: text,
        to: targetPhone90,
      };
    };

    if (bizPhone90) {
      results.push({ target: 'business', ...(await dispatchSms(bizPhone90, businessSmsText)) });
    }

    if (custPhone90) {
      results.push({ target: 'customer', ...(await dispatchSms(custPhone90, customerSmsText)) });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'SMS tetiklenemedi' },
      { status: 500 }
    );
  }
}
