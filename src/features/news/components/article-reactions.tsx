'use client';

import { CalendarCheck, Check, HandHeart, Sparkles } from 'lucide-react';

import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

import { useSetArticleReaction } from '../api/set-article-reaction';
import {
  EMPTY_REACTIONS,
  type ArticleReactions,
  type ReactionType,
} from '../types';

interface ReactionDefinition {
  type: ReactionType;
  /** Libellé au repos — une invitation à agir. */
  label: string;
  /** Libellé une fois posé — un constat. Sert aussi de nom accessible. */
  activeLabel: string;
  Icon: typeof HandHeart;
}

/**
 * Les trois réactions du SRS. Libellés français explicites : « Amen » seul
 * serait ambigu hors contexte pour un lecteur d'écran, d'où `activeLabel`.
 */
const REACTIONS: readonly ReactionDefinition[] = [
  {
    type: 'pray',
    label: 'Je prie',
    activeLabel: 'Vous priez',
    Icon: HandHeart,
  },
  {
    type: 'amen',
    label: 'Amen',
    activeLabel: 'Vous avez dit Amen',
    Icon: Sparkles,
  },
  {
    type: 'attend',
    label: 'Je participe',
    activeLabel: 'Vous participez',
    Icon: CalendarCheck,
  },
] as const;

interface ArticleReactionsBarProps {
  articleId: string;
  reactions?: ArticleReactions;
  /** `compact` : dans le fil, sous une carte. `full` : bas d'article. */
  size?: 'compact' | 'full';
  className?: string;
}

interface ReactionButtonProps {
  articleId: string;
  definition: ReactionDefinition;
  count: number;
  isActive: boolean;
  compact: boolean;
}

function ReactionButton({
  articleId,
  definition,
  count,
  isActive,
  compact,
}: ReactionButtonProps) {
  const { mutate, isPending } = useSetArticleReaction();
  const { type, label, activeLabel, Icon } = definition;

  return (
    <button
      type="button"
      // `active` porte l'état VOULU, pas une bascule côté serveur : un
      // double-clic ou un rejeu réseau n'inverse pas le résultat.
      onClick={() =>
        mutate({ articleId, reactionType: type, active: !isActive })
      }
      disabled={isPending}
      aria-pressed={isActive}
      aria-label={`${isActive ? activeLabel : label} — ${count} réaction${count === 1 ? '' : 's'}`}
      className={cn(
        // R3 — cible tactile ≥ 44 px. Un bouton de réaction est petit par
        // nature : on compense par la hauteur minimale, pas par la police.
        'inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none',
        isActive
          ? // L'état actif ne repose PAS sur la couleur seule (WCAG 1.4.1) :
            // bordure pleine, fond tenu, libellé en gras ET pastille ✓ ajoutée
            // ci-dessous. Retiré la couleur, l'état reste lisible.
            'border-primary bg-primary/12 text-primary'
          : 'border-border bg-transparent text-foreground/75 hover:border-primary/50 hover:bg-primary/5 hover:text-foreground',
        compact && 'px-3 text-[13px]',
      )}
    >
      <span className="relative flex shrink-0 items-center">
        <Icon
          className={cn('size-4', isActive && 'fill-primary/25')}
          aria-hidden="true"
        />
        {isActive && (
          // Marqueur de forme — c'est lui qui rend l'état perceptible sans
          // distinguer les couleurs.
          <Check
            className="absolute -bottom-1 -right-1.5 size-3 stroke-[3]"
            aria-hidden="true"
          />
        )}
      </span>
      <span>{isActive ? activeLabel : label}</span>
      {count > 0 && (
        <span
          className={cn(
            'tabular-nums',
            isActive ? 'font-bold' : 'font-semibold text-foreground/60',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Compteurs en lecture seule — visiteur non connecté : pas de bouton qui échoue. */
function ReadOnlyReactions({
  reactions,
  compact,
}: {
  reactions: ArticleReactions;
  compact: boolean;
}) {
  const total = REACTIONS.reduce(
    (sum, { type }) => sum + reactions.counts[type],
    0,
  );
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {REACTIONS.filter(({ type }) => reactions.counts[type] > 0).map(
        ({ type, label, Icon }) => (
          <span
            key={type}
            className={cn(
              'inline-flex items-center gap-1.5 text-foreground/70',
              compact ? 'text-[13px]' : 'text-sm',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums font-semibold">
              {reactions.counts[type]}
            </span>
            <span>{label.replace(/^Je /, '')}</span>
          </span>
        ),
      )}
      {!compact && (
        <span className="text-sm text-foreground/60">
          Connectez-vous pour réagir.
        </span>
      )}
    </div>
  );
}

/**
 * Barre de réactions — le seul geste communautaire du module Actualités.
 *
 * Un fidèle qui lit une annonce paroissiale doit pouvoir manifester qu'il prie,
 * qu'il adhère, ou qu'il sera présent. Sans ça, le fil est un mur d'affichage.
 *
 * L'état actif est porté par quatre signaux redondants — bordure, fond, graisse
 * du libellé, pastille ✓ — parce que la couleur seule ne peut pas porter une
 * information (R3 / WCAG 1.4.1), et que la cible est souvent lue en plein soleil.
 */
export function ArticleReactionsBar({
  articleId,
  reactions = EMPTY_REACTIONS,
  size = 'full',
  className,
}: ArticleReactionsBarProps) {
  const { data: user } = useUser();
  const compact = size === 'compact';

  if (!user) {
    return (
      <div className={className}>
        <ReadOnlyReactions reactions={reactions} compact={compact} />
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label="Réagir à cette actualité"
    >
      {REACTIONS.map((definition) => (
        <ReactionButton
          key={definition.type}
          articleId={articleId}
          definition={definition}
          count={reactions.counts[definition.type]}
          isActive={reactions.mine.includes(definition.type)}
          compact={compact}
        />
      ))}
    </div>
  );
}
