/**
 * RANDEVORY Notification Manager
 * Handles Web Push, Service Worker notifications, Phone vibration, and Web Audio chimes.
 */

// Register Service Worker for PWA & Background Notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

// Play pleasant, warm notification chime using Web Audio API (no external file needed)
export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (A5 - 880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch {
    // AudioContext blocked or not supported
  }
}

// Trigger phone vibration pattern
export function triggerVibration() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // Ignore vibration errors
    }
  }
}

// Check current notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await registerServiceWorker();
      // Play a quick confirmation chime & test notification
      playNotificationChime();
      sendAppNotification({
        title: '🔔 Bildirimler Başarıyla Açıldı!',
        body: 'Yeni randevu ve müşteri mesajları artık telefonunuza anında iletilecek.',
        url: '/dashboard',
      });
    }
    return perm;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return 'denied';
  }
}

export interface AppNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a native system notification to phone / desktop, plays sound, and triggers vibration.
 */
export async function sendAppNotification({
  title,
  body,
  icon = '/icon.svg',
  url = '/dashboard',
  tag,
}: AppNotificationOptions) {
  // Always trigger sound & vibration
  playNotificationChime();
  triggerVibration();

  // Dispatch custom event for in-app floating banner
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('randevory-inapp-alert', {
        detail: { title, body, url },
      })
    );
  }

  // Check if browser notifications are allowed
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    // If Service Worker is ready, use registration.showNotification (works in background on Android/iOS PWA)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        const notifOptions: any = {
          body,
          icon,
          badge: '/icon.svg',
          data: { url },
          tag: tag || `randevory-${Date.now()}`,
          vibrate: [200, 100, 200],
        };
        await reg.showNotification(title, notifOptions);
        return;
      }
    }

    // Fallback: standard Window Notification
    const notif = new Notification(title, {
      body,
      icon,
      data: { url },
      tag: tag || `randevory-${Date.now()}`,
    });

    notif.onclick = () => {
      window.focus();
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
      notif.close();
    };
  } catch (err) {
    console.warn('System notification error:', err);
  }
}
