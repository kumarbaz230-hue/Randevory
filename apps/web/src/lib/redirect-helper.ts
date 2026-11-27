/**
 * Validates user-supplied redirect paths to prevent Open Redirect and javascript: DOM XSS.
 * Only allows same-origin relative paths starting with a single '/'.
 */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  if (/[\r\n\t\\]/.test(trimmed)) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, 'https://randevory.local');
    if (parsed.origin !== 'https://randevory.local') {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
