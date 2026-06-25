import * as React from 'react';

import { Card, CardEyebrow } from '@/components/ui/card/card';
import { cn } from '@/utils/cn';

import { type MassIntention } from '../api/get-my-intentions';

import { IntentionStatusBadge } from './intention-status-badge';
import {
  INTENTION_TYPE_META,
  getIntentionTypeLabel,
} from './intention-type-label';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

interface MassIntentionCardProps {
  intention: MassIntention;
  /** Affiche l'expéditeur + la paroisse (vue clergé). */
  showRequester?: boolean;
  /** Actions contextuelles (boutons clergé) rendues sous le corps de la carte. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Carte éditoriale d'une intention de messe.
 * Surface « sacrée » teintée indigo, surtitre (date · type) en CardEyebrow,
 * corps en serif, filet or et survol/focus dessinés. Le statut reste porté
 * par le `StatusBadge` (couleur + icône + libellé → WCAG 1.4.1).
 */
export function MassIntentionCard({
  intention,
  showRequester = false,
  children,
  className,
}: MassIntentionCardProps) {
  const typeMeta = INTENTION_TYPE_META[intention.intention_type];
  const TypeIcon = typeMeta?.icon;

  return (
    <Card
      variant="sacred"
      className={cn(
        'group space-y-3 p-5 transition-[box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft hover:border-accent/40 hover:shadow-soft focus-within:border-accent/40 focus-within:shadow-soft',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <CardEyebrow className="flex min-w-0 items-center gap-1.5 text-gold-ink [&_svg]:size-3.5">
          {TypeIcon && <TypeIcon aria-hidden="true" />}
          <span className="truncate">
            {getIntentionTypeLabel(intention.intention_type)}
            {' · '}
            {formatDate(intention.created_at)}
          </span>
        </CardEyebrow>
        <IntentionStatusBadge status={intention.status} />
      </div>

      <p className="font-serif text-base leading-relaxed text-foreground">
        {intention.intention_text}
      </p>

      {(showRequester || intention.proposed_date || intention.pretre_email) && (
        <div className="hairline-gold opacity-60" aria-hidden="true" />
      )}

      <dl className="space-y-1 text-xs text-muted-foreground">
        {showRequester && (
          <div className="flex gap-1.5">
            <dt className="font-medium text-foreground/70">De</dt>
            <dd className="truncate">{intention.requestor_email}</dd>
          </div>
        )}
        {showRequester && intention.parish_name && (
          <div className="flex gap-1.5">
            <dt className="font-medium text-foreground/70">Paroisse</dt>
            <dd className="truncate">{intention.parish_name}</dd>
          </div>
        )}
        {!showRequester && intention.pretre_email && (
          <div className="flex gap-1.5">
            <dt className="font-medium text-foreground/70">Prêtre</dt>
            <dd className="truncate">{intention.pretre_email}</dd>
          </div>
        )}
        {intention.proposed_date && (
          <div className="flex gap-1.5">
            <dt className="font-medium text-foreground/70">Date proposée</dt>
            <dd>{formatDate(intention.proposed_date)}</dd>
          </div>
        )}
        {intention.celebration_date && (
          <div className="flex gap-1.5">
            <dt className="font-medium text-foreground/70">Célébrée le</dt>
            <dd>{formatDate(intention.celebration_date)}</dd>
          </div>
        )}
      </dl>

      {children && <div className="flex flex-wrap gap-2 pt-1">{children}</div>}
    </Card>
  );
}
