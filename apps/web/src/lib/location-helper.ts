/**
 * RANDEVORY Location & Maps Helper
 * Supports GPS coordinates capture, Google Maps navigation links, and chat location sharing.
 */

export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  mapsUrl: string;
}

/**
 * Returns a working navigation map URL for a business.
 * Priority:
 * 1. Explicitly configured maps_url (Google Maps pin link)
 * 2. Latitude & Longitude coordinates
 * 3. Formatted address, district & city query for Google Maps search
 */
export function getBusinessMapsUrl(business?: {
  address?: string;
  city?: string;
  district?: string;
  settings?: {
    maps_url?: string;
    latitude?: number;
    longitude?: number;
  };
} | null): string {
  if (!business) return 'https://maps.google.com';

  const customUrl = business.settings?.maps_url?.trim();
  if (customUrl) {
    return customUrl.startsWith('http') ? customUrl : `https://${customUrl}`;
  }

  const lat = business.settings?.latitude;
  const lng = business.settings?.longitude;
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const addressParts = [business.address, business.district, business.city].filter(Boolean);
  if (addressParts.length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(', '))}`;
  }

  return 'https://maps.google.com';
}

/**
 * Prompts the user's phone / browser to acquire current GPS coordinates.
 */
export function getDeviceGpsCoordinates(): Promise<GpsLocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Cihazınızda GPS / Konum servisi desteklenmiyor.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        resolve({ latitude, longitude, mapsUrl });
      },
      (error) => {
        let msg = 'Konum alınamadı.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Konum erişim izni verilmedi. Lütfen tarayıcı ayarlarından konum iznini açın.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Konum bilgisi şu an alınamıyor, lütfen GPS servisinizin açık olduğundan emin olun.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Konum alma zaman aşımına uğradı.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Detects if a text string contains a map link or coordinates.
 */
export function hasMapLink(text: string): boolean {
  if (!text) return false;
  return (
    text.includes('maps.google.com') ||
    text.includes('maps.app.goo.gl') ||
    text.includes('google.com/maps') ||
    text.includes('yandex.com/maps') ||
    text.includes('maps.apple.com') ||
    text.includes('📍')
  );
}

/**
 * Extracts the first URL from a string.
 */
export function extractUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}
