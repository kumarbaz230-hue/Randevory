/**
 * Formats a minute count into a friendly Turkish duration label.
 * 45 -> "45 dk", 60 -> "1 sa", 90 -> "1 sa 30 dk", 135 -> "2 sa 15 dk"
 */
export function formatDuration(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
}
