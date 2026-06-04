// Formatage de date FR centralisé — remplace les ~4 copies de
// `toLocaleDateString('fr-FR', …)` dans les features.

const shortFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const longFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const withTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type DateVariant = 'short' | 'long' | 'datetime';

/**
 * Formate une date ISO en français. `variant` :
 * - `short`   → 3 janv. 2026
 * - `long`    → 3 janvier 2026 (défaut)
 * - `datetime`→ 3 janvier 2026 à 14:05
 */
export function formatFrDate(
  iso: string | null | undefined,
  variant: DateVariant = 'long',
): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  if (variant === 'short') return shortFmt.format(date);
  if (variant === 'datetime') return withTimeFmt.format(date);
  return longFmt.format(date);
}
