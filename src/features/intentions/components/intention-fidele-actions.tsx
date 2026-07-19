'use client';

import { CalendarCheck, Download, FileText } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { formatFrDate } from '@/utils/format-date';

import { useConfirmIntentionDate } from '../api/confirm-intention-date';
import { useIntentionReceipt } from '../api/get-intention-receipt';
import { type MassIntention } from '../api/get-my-intentions';

/** Cible tactile confortable (R3) : 44px sur mobile, densité conservée ensuite. */
const ACTION_CLASS = 'h-11 w-full sm:w-auto';

interface IntentionFideleActionsProps {
  intention: MassIntention;
}

/**
 * Y a-t-il quelque chose à faire pour le fidèle sur cette intention ?
 *
 * Exporté pour que l'appelant n'insère pas un conteneur d'actions vide autour
 * d'un composant qui ne rendra rien — la source de vérité des étapes reste ici.
 */
export function hasFideleActions(intention: MassIntention): boolean {
  return (
    (intention.status === 'date_proposed' && !!intention.proposed_date) ||
    intention.status === 'celebrated'
  );
}

/**
 * Ce que le fidèle peut FAIRE sur son intention, selon l'étape du parcours.
 *
 * Deux moments seulement — le reste du cycle appartient à la paroisse :
 *  - `date_proposed` : c'est à lui de jouer, il confirme la date proposée ;
 *  - `celebrated`    : il récupère son reçu.
 *
 * Aucune action n'est proposée pour un statut où le serveur la refuserait :
 * un bouton qui garantit un 400 est un piège, pas une fonctionnalité.
 */
export function IntentionFideleActions({
  intention,
}: IntentionFideleActionsProps) {
  const { addNotification } = useNotifications();
  const [error, setError] = useState<string | null>(null);

  const { mutate: confirmDate, isPending: confirming } =
    useConfirmIntentionDate();
  const { mutate: fetchReceipt, isPending: fetchingReceipt } =
    useIntentionReceipt();

  const isAwaitingConfirmation =
    intention.status === 'date_proposed' && !!intention.proposed_date;
  const isCelebrated = intention.status === 'celebrated';

  if (!hasFideleActions(intention)) return null;

  function handleConfirm() {
    setError(null);
    confirmDate(intention.id, {
      onSuccess: () =>
        addNotification({
          type: 'success',
          title: 'Date confirmée',
          message:
            'Votre paroisse est informée. La messe sera célébrée à cette date.',
        }),
      // Un échec doit se VOIR : sans ce retour, le fidèle recliquait sur un
      // bouton qui ne faisait rien et croyait la date confirmée.
      onError: () =>
        setError(
          "La confirmation n'a pas pu être enregistrée. Réessayez dans un instant.",
        ),
    });
  }

  function handleFetchReceipt() {
    setError(null);
    fetchReceipt(intention.id, {
      onSuccess: (receipt) => {
        if (!receipt.receipt_url) {
          setError("Le reçu n'est pas encore disponible. Réessayez plus tard.");
          return;
        }
        window.open(receipt.receipt_url, '_blank', 'noopener,noreferrer');
      },
      onError: () =>
        setError('Le reçu n’a pas pu être récupéré. Réessayez.'),
    });
  }

  return (
    <div className="w-full space-y-2">
      {isAwaitingConfirmation && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Votre paroisse propose le{' '}
            <span className="font-medium text-foreground">
              {formatFrDate(intention.proposed_date as string, 'long')}
            </span>
            . Confirmez pour que la messe soit célébrée à cette date.
          </p>
          <Button
            variant="default"
            className={ACTION_CLASS}
            isLoading={confirming}
            disabled={confirming}
            icon={<CalendarCheck className="size-4" aria-hidden="true" />}
            onClick={handleConfirm}
          >
            Confirmer cette date
          </Button>
        </div>
      )}

      {isCelebrated &&
        // Cas courant : l'URL arrive déjà dans la charge utile → lien direct,
        // pas d'aller-retour ni de fenêtre bloquée par le navigateur.
        (intention.receipt_url ? (
          <a
            href={intention.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            <Download className="size-4" aria-hidden="true" />
            Télécharger le reçu
          </a>
        ) : (
          // Repli : reçu pas encore émis (indisponibilité de stockage au moment
          // de la célébration) — le serveur le régénère à la demande.
          <Button
            variant="outline"
            className={ACTION_CLASS}
            isLoading={fetchingReceipt}
            disabled={fetchingReceipt}
            icon={<FileText className="size-4" aria-hidden="true" />}
            onClick={handleFetchReceipt}
          >
            Obtenir mon reçu
          </Button>
        ))}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
