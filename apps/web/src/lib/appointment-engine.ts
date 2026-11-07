import { Appointment, Business, Service, Staff, TimeSlot, WorkingHour } from '@/types';

/**
 * RANDEVORY Slot Hesaplama ve Çakışma Önleme Motoru
 * Bu motor hem istemci hem de sunucu tarafında aynı mantıkla çalışarak
 * çakışan randevuların oluşmasını 0'a indirir.
 */

// Saat string'ini (HH:mm) dakikaya çevirir (Örn: "09:30" -> 570)
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// Dakikayı saat string'ine (HH:mm) çevirir (Örn: 570 -> "09:30")
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * İki zaman aralığının çakışıp çakışmadığını kontrol eder.
 * [startA, endA) ve [startB, endB)
 */
export function isOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Belirli bir tarih, hizmet ve personel için uygun randevu saatlerini hesaplar.
 */
export function generateAvailableSlots(params: {
  date: Date; // Hedef gün
  service: Service;
  staffList: Staff[]; // İlgili veya tüm personeller
  workingHours: WorkingHour[]; // İşletme çalışma saatleri
  existingAppointments: Appointment[];
  slotIntervalMinutes?: number;
}): TimeSlot[] {
  const {
    date,
    service,
    staffList,
    workingHours,
    existingAppointments,
    slotIntervalMinutes = 30,
  } = params;

  const dayOfWeek = date.getDay(); // 0: Pazar, 1: Pazartesi...
  const daySchedule = workingHours.find((w) => w.day_of_week === dayOfWeek);

  // İşletme bu gün kapalıysa boş liste döndür
  if (!daySchedule || !daySchedule.is_open) {
    return [];
  }

  const openMinutes = timeToMinutes(daySchedule.open_time);
  const closeMinutes = timeToMinutes(daySchedule.close_time);
  const serviceDuration = service.duration_minutes + (service.buffer_after_minutes || 0);

  const availableSlots: TimeSlot[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Hedef günün başlangıç ve bitişi
  const now = new Date();

  // openMinutes'tan closeMinutes'a kadar slot adımlarıyla ilerle
  for (let m = openMinutes; m + serviceDuration <= closeMinutes; m += slotIntervalMinutes) {
    // Öğle molası kontrolü
    if (daySchedule.break_start && daySchedule.break_end) {
      const breakStart = timeToMinutes(daySchedule.break_start);
      const breakEnd = timeToMinutes(daySchedule.break_end);
      if (m < breakEnd && m + serviceDuration > breakStart) {
        continue; // Mola aralığına denk geliyor
      }
    }

    const slotStart = new Date(year, month, day, Math.floor(m / 60), m % 60, 0);
    const slotEnd = new Date(slotStart.getTime() + service.duration_minutes * 60 * 1000);

    // Geçmiş zaman kontrolü (Bugün ise şu anki saatten önce olamaz)
    if (slotStart <= now) {
      continue;
    }

    // Bu slot için uygun en az bir personel bul
    for (const staff of staffList) {
      // Personel bu hizmeti verebiliyor mu?
      if (
        staff.assigned_service_ids.length > 0 &&
        !staff.assigned_service_ids.includes(service.id)
      ) {
        continue;
      }

      // Personelin mevcut randevularıyla çakışma var mı?
      const hasConflict = existingAppointments.some((appt) => {
        if (appt.staff_id !== staff.id) return false;
        if (appt.status === 'cancelled' || appt.status === 'no_show') return false;

        const apptStart = new Date(appt.start_time);
        const apptEnd = new Date(appt.end_time);

        return isOverlapping(slotStart, slotEnd, apptStart, apptEnd);
      });

      if (!hasConflict) {
        availableSlots.push({
          time: minutesToTime(m),
          isoStartTime: slotStart.toISOString(),
          isoEndTime: slotEnd.toISOString(),
          available: true,
          staff_id: staff.id,
          staff_name: staff.name,
        });
        break; // Bu saat dilimi için bir personel bulundu, bir sonraki saate geç
      }
    }
  }

  return availableSlots;
}

/**
 * Randevu kaydetmeden önce son çakışma güvencesi doğrulaması
 */
export function validateAppointmentConflict(params: {
  staffId: string;
  startTime: string;
  endTime: string;
  existingAppointments: Appointment[];
  excludeAppointmentId?: string;
}): { valid: boolean; reason?: string } {
  const { staffId, startTime, endTime, existingAppointments, excludeAppointmentId } = params;

  const reqStart = new Date(startTime);
  const reqEnd = new Date(endTime);

  if (reqStart >= reqEnd) {
    return { valid: false, reason: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır.' };
  }

  const conflict = existingAppointments.find((appt) => {
    if (excludeAppointmentId && appt.id === excludeAppointmentId) return false;
    if (appt.staff_id !== staffId) return false;
    if (appt.status === 'cancelled' || appt.status === 'no_show') return false;

    const aStart = new Date(appt.start_time);
    const aEnd = new Date(appt.end_time);

    return isOverlapping(reqStart, reqEnd, aStart, aEnd);
  });

  if (conflict) {
    return {
      valid: false,
      reason: 'Seçilen personel için bu saat aralığında başka bir randevu zaten mevcut.',
    };
  }

  return { valid: true };
}
