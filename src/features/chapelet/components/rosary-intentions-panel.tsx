'use client';

import { HandHeart } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { LiveIntention } from '../hooks/use-community-rosary-socket';

interface RosaryIntentionsPanelProps {
  intentions: LiveIntention[];
  /** Le parent arbitre la voie d'envoi (WebSocket en direct, sinon REST). */
  onSubmit: (text: string) => void;
  isSubmitting?: boolean;
  hasError?: boolean;
}

/**
 * Intentions communes de la session : ce que les autres confient, en direct.
 * Le flux est annoncé en `aria-live="polite"` pour qu'un lecteur d'écran
 * entende les nouvelles intentions sans que le focus soit volé.
 */
export function RosaryIntentionsPanel({
  intentions,
  onSubmit,
  isSubmitting = false,
  hasError = false,
}: RosaryIntentionsPanelProps) {
  const [text, setText] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <section
      aria-labelledby="rosary-intentions-heading"
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2
        id="rosary-intentions-heading"
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <HandHeart className="size-4 text-primary" aria-hidden="true" />
        Intentions communes
      </h2>

      <ul aria-live="polite" className="mt-3 space-y-2">
        {intentions.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            Aucune intention confiée pour l’instant. Soyez le premier.
          </li>
        ) : (
          intentions.map((intention) => (
            <li
              key={intention.id}
              className="rounded-lg border border-border/60 bg-background-surface/60 p-3"
            >
              <p className="text-sm text-foreground">{intention.text}</p>
              <p className="mt-1 text-caption text-muted-foreground">
                {intention.submittedBy}
              </p>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={handleSubmit} className="mt-4">
        <label
          htmlFor="rosary-live-intention"
          className="mb-1.5 block text-caption font-medium text-foreground"
        >
          Confier une intention
        </label>
        <Input
          id="rosary-live-intention"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ex. Pour ma famille"
          maxLength={280}
        />
        <Button
          type="submit"
          fullWidth
          className="mt-2"
          disabled={isSubmitting || text.trim().length === 0}
        >
          {isSubmitting ? 'Envoi…' : 'Confier'}
        </Button>
        {hasError && (
          <p role="alert" className="mt-2 text-caption text-destructive">
            Impossible d’envoyer l’intention. Veuillez réessayer.
          </p>
        )}
      </form>
    </section>
  );
}
