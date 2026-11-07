'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Tekrarlanan SMTP isteklerini ve 429 over_email_send_rate_limit hatalarını engellemek için
 * 60 saniyelik geri sayım ve localStorage tabanlı cooldown koruması sağlar.
 */
export function useResendCooldown(purpose: string = 'general', cooldownDuration: number = 60) {
  const storageKey = `randevory_cooldown_${purpose}`;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Kalan süreyi hesapla
  const getRemainingSeconds = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return 0;
      const sendTime = parseInt(stored, 10);
      if (isNaN(sendTime)) return 0;
      const elapsed = Math.floor((Date.now() - sendTime) / 1000);
      const remaining = cooldownDuration - elapsed;
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }, [storageKey, cooldownDuration]);

  const [cooldown, setCooldown] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`randevory_cooldown_${purpose}`);
        if (stored) {
          const sendTime = parseInt(stored, 10);
          if (!isNaN(sendTime)) {
            const elapsed = Math.floor((Date.now() - sendTime) / 1000);
            const remaining = cooldownDuration - elapsed;
            return remaining > 0 ? remaining : 0;
          }
        }
      } catch {}
    }
    return 0;
  });

  // Sayfa yüklendiğinde ve sayaç işlerken
  useEffect(() => {
    const initialRemaining = getRemainingSeconds();
    setCooldown(initialRemaining);

    timerRef.current = setInterval(() => {
      const rem = getRemainingSeconds();
      setCooldown(rem);
      if (rem <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [getRemainingSeconds]);

  // 60 saniyelik yeni bekleme başlat
  const startCooldown = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, Date.now().toString());
      } catch (err) {
        console.error('Cooldown localStorage error:', err);
      }
    }
    setCooldown(cooldownDuration);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const rem = getRemainingSeconds();
      setCooldown(rem);
      if (rem <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    }, 500);
  }, [storageKey, cooldownDuration, getRemainingSeconds]);

  return {
    cooldown,
    canResend: cooldown <= 0,
    startCooldown,
  };
}
