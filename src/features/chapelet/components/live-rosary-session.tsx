'use client';

import { ChevronRight, CircleStop, Radio } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/lib/auth';

import { useEndCommunityRosary } from '../api/end-community-rosary';
import type { CommunityRosary } from '../api/get-community-rosaries';
import { useRosaryIntentions } from '../api/get-rosary-intentions';
import { useJoinCommunityRosary } from '../api/join-community-rosary';
import { useSubmitRosaryIntention } from '../api/submit-rosary-intention';
import type { LiveIntention } from '../hooks/use-community-rosary-socket';
import { useCommunityRosarySocket } from '../hooks/use-community-rosary-socket';
import { mergeIntentions } from '../utils/merge-intentions';

import { RosaryActionRejected } from './rosary-action-rejected';
import { RosaryConnectionBanner } from './rosary-connection-banner';
import { RosaryDecadeProgress } from './rosary-decade-progress';
import { RosaryIntentionsPanel } from './rosary-intentions-panel';
import { RosaryParticipants } from './rosary-participants';

interface LiveRosarySessionProps {
  rosary: CommunityRosary;
  onLeave: () => void;
}

/**
 * Écran de prière en direct — archétype « Lecture » : immersif, bleu dominant,
 * la décade en cours porte l'échelle.
 *
 * Deux voies coexistent volontairement, parce que le backend les distingue :
 * les actions passent par le WebSocket (seul chemin qui DIFFUSE au groupe), et
 * retombent sur REST quand le socket est fermé (l'action est alors persistée
 * mais pas diffusée). Voir `apps/rosary/consumers.py`.
 */
export function LiveRosarySession({ rosary, onLeave }: LiveRosarySessionProps) {
  const { data: user } = useUser();
  const [endedByRest, setEndedByRest] = useState(false);
  const [fallbackIntentions, setFallbackIntentions] = useState<LiveIntention[]>(
    [],
  );
  const fallbackSeqRef = useRef(0);

  const {
    mutate: join,
    data: joined,
    isError: hasJoinError,
  } = useJoinCommunityRosary();

  // `join` est idempotent côté serveur (get_or_create) ; le garde-fou évite
  // malgré tout le double appel du double-montage StrictMode en développement.
  const joinRequestedRef = useRef<number | null>(null);
  useEffect(() => {
    if (joinRequestedRef.current === rosary.id) return;
    joinRequestedRef.current = rosary.id;
    join(rosary.id);
  }, [join, rosary.id]);

  const session = joined ?? rosary;
  const socket = useCommunityRosarySocket({
    rosaryId: rosary.id,
    initialDecade: session.current_decade,
    // Le socket n'ouvre qu'une fois la participation enregistrée : inutile de
    // se connecter à une session que le serveur vient peut-être de refuser.
    enabled: Boolean(joined),
  });

  // Intentions déposées AVANT notre connexion : le socket ne diffuse que ce qui
  // est émis depuis son ouverture. Un 403 (compte non participant) est traité
  // comme une absence d'historique — la prière en direct continue.
  const { data: intentionsHistory } = useRosaryIntentions({
    rosaryId: rosary.id,
    enabled: Boolean(joined),
  });

  const historyIntentions = useMemo<LiveIntention[]>(
    () =>
      (intentionsHistory?.results ?? []).map((intention) => ({
        id: `history-intention-${intention.id}`,
        serverId: intention.id,
        text: intention.text,
        submittedBy: intention.submitted_by ?? 'Anonyme',
      })),
    [intentionsHistory],
  );

  const {
    mutate: submitViaRest,
    isPending: isSubmitting,
    isError: hasSubmitError,
  } = useSubmitRosaryIntention({
    onSuccess: ({ text }) => {
      fallbackSeqRef.current += 1;
      setFallbackIntentions((prev) => [
        ...prev,
        {
          id: `rest-intention-${fallbackSeqRef.current}`,
          text,
          submittedBy: user?.email ?? 'Vous',
        },
      ]);
    },
  });

  const { mutate: endViaRest, isPending: isEnding } = useEndCommunityRosary({
    onSuccess: () => setEndedByRest(true),
  });

  // Le serveur tranche (`session_state.is_initiator`) : c'est lui qui arbitre
  // l'action, et une comparaison d'e-mails côté client est plus fragile
  // (casse, alias, e-mail absent du profil). La comparaison ne sert que le
  // temps que la trame arrive.
  const isInitiator =
    socket.isInitiator ??
    Boolean(user?.email && session.initiator_email === user.email);
  const isEnded = socket.status === 'ended' || endedByRest;

  const intentions = useMemo(
    () =>
      mergeIntentions(historyIntentions, [
        ...socket.intentions,
        ...fallbackIntentions,
      ]),
    [historyIntentions, socket.intentions, fallbackIntentions],
  );

  const handleSubmitIntention = (text: string) => {
    // Voie directe : diffuse aux autres priants immédiatement.
    if (socket.submitIntention(text)) return;
    submitViaRest({ rosaryId: rosary.id, text });
  };

  const handleEnd = () => {
    if (socket.end()) return;
    endViaRest(rosary.id);
  };

  const handleRetryJoin = () => {
    joinRequestedRef.current = null;
    join(rosary.id);
  };

  if (isEnded) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-caption font-medium uppercase tracking-widest text-muted-foreground">
            Chapelet communautaire
          </p>
          <p className="mt-2 font-serif text-headline text-foreground">
            Prière achevée
          </p>
          <p className="mx-auto mt-3 max-w-prose text-sm text-muted-foreground">
            La session est close. Merci d’avoir prié avec la communauté.
          </p>
        </section>
        <Button fullWidth onClick={onLeave}>
          Revenir à la liste
        </Button>
      </div>
    );
  }

  if (hasJoinError) {
    return (
      <ErrorState
        title="Impossible de rejoindre ce chapelet"
        description="La session est peut-être déjà terminée, ou la connexion a échoué."
        onRetry={handleRetryJoin}
      />
    );
  }

  if (!joined) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">Connexion au chapelet en cours…</span>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RosaryConnectionBanner status={socket.status} onRetry={socket.retry} />

      <RosaryActionRejected
        rejection={socket.rejection}
        onDismiss={socket.dismissRejection}
      />

      <header className="text-center">
        <p className="flex items-center justify-center gap-2 text-caption font-medium uppercase tracking-widest text-primary">
          <Radio
            className="size-3.5 animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          {session.mystery_group_name ?? 'Chapelet en cours'}
        </p>
        {session.intention && (
          <p className="mx-auto mt-2 max-w-prose font-serif text-title italic text-foreground">
            {session.intention}
          </p>
        )}
      </header>

      <RosaryDecadeProgress currentDecade={socket.currentDecade} />

      {isInitiator && (
        <div className="space-y-2">
          <Button
            fullWidth
            onClick={socket.advance}
            disabled={socket.status !== 'online'}
            icon={<ChevronRight className="size-4" aria-hidden="true" />}
            iconPosition="right"
          >
            Décade suivante
          </Button>
          <Button
            fullWidth
            variant="outline"
            onClick={handleEnd}
            disabled={isEnding}
            icon={<CircleStop className="size-4" aria-hidden="true" />}
          >
            {isEnding ? 'Clôture…' : 'Terminer le chapelet'}
          </Button>
          {socket.status !== 'online' && (
            <p className="text-caption text-muted-foreground">
              La progression ne peut être avancée que connecté aux autres
              priants.
            </p>
          )}
        </div>
      )}

      <RosaryParticipants
        count={socket.participantCount}
        participants={socket.participants}
      />

      <RosaryIntentionsPanel
        intentions={intentions}
        onSubmit={handleSubmitIntention}
        isSubmitting={isSubmitting}
        hasError={hasSubmitError}
      />

      <Button variant="ghost" fullWidth onClick={onLeave}>
        Quitter le chapelet
      </Button>
    </div>
  );
}
