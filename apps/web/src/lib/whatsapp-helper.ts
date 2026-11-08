/**
 * RANDEVORY WhatsApp Bildirim ve Mesaj Oluşturucu Yardımcıları
 */

export function formatWhatsAppPhone(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/[^0-9]/g, '');
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return '';
  return `90${last10}`;
}

export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  const targetPhone = formatWhatsAppPhone(rawPhone);
  const encoded = encodeURIComponent(message || '');
  return targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function createCustomerToBusinessWhatsAppUrl(params: {
  businessPhone: string;
  businessName: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName?: string;
  startTime: string;
  totalPrice: number;
  appointmentId: string;
  notes?: string;
}): string {
  const targetPhone = formatWhatsAppPhone(params.businessPhone);
  const dateStr = new Date(params.startTime).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
  const timeStr = new Date(params.startTime).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const code = params.appointmentId.slice(0, 8).toUpperCase();

  const lines = [
    `Merhaba *${params.businessName}*! 👋`,
    `Az önce *RANDEVORY* üzerinden yeni bir randevu oluşturdum:`,
    ``,
    `📅 *Tarih:* ${dateStr}`,
    `⏰ *Saat:* ${timeStr}`,
    `✂️ *Hizmet:* ${params.serviceName} (${params.totalPrice} ₺)`,
    params.staffName ? `👤 *Uzman:* ${params.staffName}` : '',
    `🙋‍♂️ *Müşteri:* ${params.customerName} (${params.customerPhone})`,
    params.notes ? `📝 *Not:* ${params.notes}` : '',
    `🔢 *Randevu Kodu:* #${code}`,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  return targetPhone ? `https://wa.me/${targetPhone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function createBusinessToCustomerWhatsAppUrl(params: {
  customerPhone: string;
  customerName: string;
  businessName: string;
  businessSlug: string;
  businessAddress?: string;
  mapsUrl?: string;
  serviceName: string;
  staffName?: string;
  startTime: string;
  totalPrice: number;
  type: 'confirmed' | 'reminder' | 'cancelled';
}): string {
  const targetPhone = formatWhatsAppPhone(params.customerPhone);
  const dateStr = new Date(params.startTime).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
  const timeStr = new Date(params.startTime).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const manageUrl = `https://www.randevory.com/${params.businessSlug}`;

  let lines: string[] = [];

  if (params.type === 'confirmed') {
    lines = [
      `Merhaba Sayın *${params.customerName}*! 👋`,
      `*${params.businessName}* işletmemizdeki randevunuz *ONAYLANMIŞTIR* ✅`,
      ``,
      `📅 *Tarih:* ${dateStr}`,
      `⏰ *Saat:* ${timeStr}`,
      `✨ *Hizmet:* ${params.serviceName} (${params.totalPrice} ₺)`,
      params.staffName ? `👤 *Uzman:* ${params.staffName}` : '',
      params.businessAddress ? `📍 *Adres:* ${params.businessAddress}` : '',
      params.mapsUrl ? `🗺️ *Harita & Yol Tarifi:* ${params.mapsUrl}` : '',
      ``,
      `🔗 Randevu Sorgulama / İptal: ${manageUrl}`,
      `Sizi bekliyoruz, sağlıklı günler dileriz!`,
    ];
  } else if (params.type === 'cancelled') {
    lines = [
      `Merhaba Sayın *${params.customerName}*,`,
      `*${params.businessName}* işletmemizdeki *${dateStr} saat ${timeStr}* tarihli randevunuz iptal edilmiştir.`,
      ``,
      `🔗 Yeni bir tarihe randevu almak için: ${manageUrl}`,
    ];
  } else {
    lines = [
      `Merhaba Sayın *${params.customerName}*! 🔔`,
      `*${params.businessName}* işletmemizdeki *${dateStr} saat ${timeStr}* (${params.serviceName}) randevunuzu hatırlatmak isteriz.`,
      ``,
      `🔗 Randevu Detay / İptal: ${manageUrl}`,
    ];
  }

  const text = encodeURIComponent(lines.filter(Boolean).join('\n'));
  return targetPhone ? `https://wa.me/${targetPhone}?text=${text}` : `https://wa.me/?text=${text}`;
}
