'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as React from 'react';

import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

interface RelativeTimeProps {
  iso?: string | null;
  className?: string;
  /** Ajoute « il y a … » (défaut true). */
  addSuffix?: boolean;
}

/**
 * Temps relatif en français (« il y a 3 min »), via dayjs (dépendance déclarée).
 * Remplace les 3 formateurs de temps relatif faits main.
 */
export function RelativeTime({
  iso,
  className,
  addSuffix = true,
}: RelativeTimeProps) {
  if (!iso) return null;
  const d = dayjs(iso);
  if (!d.isValid()) return null;
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {d.fromNow(!addSuffix)}
    </time>
  );
}
