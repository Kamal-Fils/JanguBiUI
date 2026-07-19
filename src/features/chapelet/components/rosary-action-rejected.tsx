'use client';

import { ShieldAlert, X } from 'lucide-react';

import type { RosaryActionRejection } from '../hooks/use-community-rosary-socket';

/**
 * Libellés des actions refusables. Le motif vient du serveur ; l'action, elle,
 * est un identifiant technique (`advance`) qu'il faut traduire pour l'écran.
 */
const ACTION_LABELS: Record<string, string> = {
  advance: 'Décade suivante',
  end: 'Terminer le chapelet',
  submit_intention: 'Confier une intention',
};

interface RosaryActionRejectedProps {
  rejection: RosaryActionRejection | null;
  onDismiss: () => void;
}

/**
 * Retour visible sur une action refusée par le serveur (trame
 * `action_rejected`).
 *
 * Avant elle, un `advance` émis par un non-initiateur — ou après clôture —
 * disparaissait sans trace : l'utilisateur ne pouvait pas distinguer « refusé »
 * de « perdu en route », et réessayait dans le vide.
 *
 * Volontairement NON bloquant : pas de `alert()`, pas de modale. On prie ;
 * l'écran ne doit pas être interrompu. Le message s'efface seul
 * (`REJECTION_VISIBLE_MS`) et peut être masqué plus tôt.
 */
export function RosaryActionRejected({
  rejection,
  onDismiss,
}: RosaryActionRejectedProps) {
  if (!rejection) return null;

  const label = ACTION_LABELS[rejection.action] ?? 'Action';

  return (
    <div
      // Remonté à chaque nouveau refus : un lecteur d'écran ré-annonce même
      // lorsque le motif est identique au précédent.
      key={rejection.id}
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1 py-1.5">
        <span className="font-medium">{label} — action refusée.</span>{' '}
        {rejection.reason}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Masquer l’avertissement"
        className="-my-1 -mr-1.5 flex size-11 shrink-0 items-center justify-center rounded transition-colors hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
