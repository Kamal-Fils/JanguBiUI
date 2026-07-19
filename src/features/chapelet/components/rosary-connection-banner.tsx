'use client';

import { Loader2, WifiOff } from 'lucide-react';

import { cn } from '@/utils/cn';

import type { RosarySocketStatus } from '../hooks/use-community-rosary-socket';

interface RosaryConnectionBannerProps {
  status: RosarySocketStatus;
  /** Relance la connexion — proposé uniquement en `offline`. */
  onRetry?: () => void;
}

const BANNER_COPY: Record<
  'connecting' | 'reconnecting' | 'offline',
  { label: string; tone: string; spinning: boolean }
> = {
  connecting: {
    label: 'Connexion au chapelet…',
    tone: 'bg-info/10 text-info',
    spinning: true,
  },
  reconnecting: {
    label: 'Reconnexion…',
    tone: 'bg-warning/10 text-warning',
    spinning: true,
  },
  offline: {
    label: 'Hors ligne — progression figée',
    tone: 'bg-destructive/10 text-destructive',
    spinning: false,
  },
};

/**
 * Bannière d'état du temps réel du chapelet communautaire.
 * Muette quand la prière est en direct (`online`) ou close (`ended`) : ces deux
 * états sont déjà portés par l'écran lui-même.
 * Le signal repose sur icône + texte, jamais la couleur seule (WCAG 1.4.1).
 */
export function RosaryConnectionBanner({
  status,
  onRetry,
}: RosaryConnectionBannerProps) {
  if (status === 'online' || status === 'ended') return null;

  const { label, tone, spinning } = BANNER_COPY[status];

  return (
    <div
      role="status"
      className={cn(
        'flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium',
        tone,
      )}
    >
      {spinning ? (
        <Loader2
          className="size-3.5 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <WifiOff className="size-3.5" aria-hidden="true" />
      )}
      <span>{label}</span>
      {status === 'offline' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded px-2 font-semibold underline underline-offset-2 transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
