'use client';

import { Users } from 'lucide-react';

interface RosaryParticipantsProps {
  /** Compteur autoritaire renvoyé par le serveur à chaque arrivée. */
  count: number;
  /** E-mails de TOUS les priants de la session. */
  participants: string[];
}

/**
 * Présence des priants — compteur ET liste viennent désormais du serveur.
 *
 * La trame `session_state` livre la liste NOMINATIVE complète à la connexion,
 * puis `participant_joined` la complète en direct. Auparavant seule la seconde
 * existait : la liste s'arrêtait aux arrivées postérieures à notre connexion,
 * d'où un libellé « depuis votre arrivée » qui avouait l'approximation. Elle
 * est exhaustive maintenant, donc ce libellé n'a plus lieu d'être.
 */
export function RosaryParticipants({
  count,
  participants,
}: RosaryParticipantsProps) {
  return (
    <section
      aria-labelledby="rosary-participants-heading"
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2
        id="rosary-participants-heading"
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <Users className="size-4 text-primary" aria-hidden="true" />
        {count > 0
          ? `${count} participant${count > 1 ? 's' : ''}`
          : 'Participants'}
      </h2>

      {participants.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {participants.map((email) => (
            <li key={email} className="text-sm text-muted-foreground">
              {email}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun priant connecté pour l’instant.
        </p>
      )}
    </section>
  );
}
