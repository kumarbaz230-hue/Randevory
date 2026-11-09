import { Business, RestaurantTable, Appointment } from '@/types';

export const DEFAULT_TABLE_SECTIONS = [
  { id: 'all', label: 'Tüm Masalar', icon: '🍽️' },
  { id: 'bahce', label: 'Bahçe / Açık Hava', icon: '🌿' },
  { id: 'salon', label: 'Ana Salon (İç Mekan)', icon: '🏠' },
  { id: 'teras', label: 'Teras / Manzara', icon: '🌅' },
  { id: 'vip', label: 'VIP Loca', icon: '⭐' },
] as const;

export const DEFAULT_RESTAURANT_TABLES: RestaurantTable[] = [
  // Bahçe
  { id: 'tbl-b1', name: 'Bahçe Masa 1', section: 'bahce', capacity: 2, features: ['Ferah Köşe', 'Açık Hava'] },
  { id: 'tbl-b2', name: 'Bahçe Masa 2', section: 'bahce', capacity: 4, features: ['Güneş Alan', 'Geniş Alan'] },
  { id: 'tbl-b3', name: 'Bahçe Masa 3', section: 'bahce', capacity: 4, features: ['Çiçeklik Yanı', 'Havadar'] },
  { id: 'tbl-b4', name: 'Bahçe Masa 4', section: 'bahce', capacity: 6, features: ['Aile Masası', 'Geniş'] },

  // Ana Salon
  { id: 'tbl-s1', name: 'Salon Masa 1', section: 'salon', capacity: 2, features: ['Cam Kenarı', 'Sessiz'] },
  { id: 'tbl-s2', name: 'Salon Masa 2', section: 'salon', capacity: 2, features: ['Prizli', 'Çalışmaya Uygun'] },
  { id: 'tbl-s3', name: 'Salon Masa 3', section: 'salon', capacity: 4, features: ['Merkez Alan', 'Rahat Koltuk'] },
  { id: 'tbl-s4', name: 'Salon Masa 4', section: 'salon', capacity: 4, features: ['Cam Kenarı', 'Ferah'] },
  { id: 'tbl-s5', name: 'Salon Masa 5', section: 'salon', capacity: 6, features: ['Geniş Koltuk', 'Grup Masası'] },

  // Teras
  { id: 'tbl-t1', name: 'Teras Masa 1', section: 'teras', capacity: 2, features: ['Manzaralı', 'Romantik'] },
  { id: 'tbl-t2', name: 'Teras Masa 2', section: 'teras', capacity: 4, features: ['Ön Sıra', 'Geniş'] },
  { id: 'tbl-t3', name: 'Teras Masa 3', section: 'teras', capacity: 4, features: ['Esintili', 'Manzaralı'] },

  // VIP Loca
  { id: 'tbl-v1', name: 'VIP Loca 1', section: 'vip', capacity: 8, features: ['Özel Bölüm', 'Doğum Günü / Kutlama'] },
  { id: 'tbl-v2', name: 'VIP Loca 2', section: 'vip', capacity: 10, features: ['Ses Yalıtımlı', 'Özel Servis', 'TV'] },
];

export function getBusinessTables(business?: Business | null): RestaurantTable[] {
  if (business?.settings?.custom_tables && business.settings.custom_tables.length > 0) {
    return business.settings.custom_tables.filter((t) => t.is_active !== false);
  }
  return DEFAULT_RESTAURANT_TABLES;
}

export function isTableBookingEnabled(business?: Business | null): boolean {
  if (!business) return false;
  // If explicitly disabled:
  if (business.settings?.enable_table_booking === false) return false;
  // If cafe/restaurant or gaming activity:
  if (business.sector === 'cafe_restaurant' || business.sector === 'activity_gaming') return true;
  // If explicitly enabled:
  if (business.settings?.enable_table_booking === true) return true;
  // If custom tables exist:
  if (business.settings?.custom_tables && business.settings.custom_tables.length > 0) return true;
  return false;
}

export function isTableReserved(
  tableId: string,
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // HH:mm
  appointments: Appointment[]
): boolean {
  return appointments.some((apt) => {
    if (apt.status === 'cancelled') return false;
    const isMatchingTable =
      apt.table_id === tableId ||
      (apt.customer_notes && apt.customer_notes.includes(tableId)) ||
      (apt.internal_notes && apt.internal_notes.includes(tableId));

    if (!isMatchingTable) return false;

    // Check same date & approximate time (within 90 min)
    const aptDate = new Date(apt.start_time);
    const aptDateStr = aptDate.toISOString().split('T')[0];
    if (aptDateStr !== dateStr) return false;

    const aptHours = aptDate.getHours();
    const aptMins = aptDate.getMinutes();
    const [targetHours, targetMins] = timeStr.split(':').map(Number);

    const aptTotalMins = aptHours * 60 + aptMins;
    const targetTotalMins = targetHours * 60 + targetMins;

    // Table reservation block lasts 90 minutes
    return Math.abs(aptTotalMins - targetTotalMins) < 90;
  });
}
