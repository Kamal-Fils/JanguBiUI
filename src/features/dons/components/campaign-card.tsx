'use client';

import { Check, HeartHandshake } from 'lucide-react';

import { CardEyebrow } from '@/components/ui/card/card';
import { cn } from '@/utils/cn';

import { DonationCampaign } from '../api/get-campaigns';
import { formatXof } from '../utils/format-xof';

const DONATION_TYPE_LABELS: Record<string, string> = {
  sunday_collection: 'Quête du dimanche',
  church_tithe: "Denier de l'Église",
  mass_intention_offering: 'Offrande de messe',
  special_project: 'Projet spécial',
  free_donation: 'Don libre',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface CampaignCardProps {
  campaign: DonationCampaign;
  selected: boolean;
  onToggle: () => void;
}

/**
 * Carte de campagne « Sacred Editorial » : surtitre (type de don), titre serif,
 * montants tabular-nums en XOF et pastille de sélection. Toggle contrôlé par
 * la page (`aria-pressed`).
 */
export function CampaignCard({
  campaign,
  selected,
  onToggle,
}: CampaignCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'group w-full overflow-hidden rounded-2xl border text-left shadow-soft-sm transition-[transform,box-shadow,border-color,background-color] duration-[var(--duration-normal)] ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] motion-reduce:transform-none',
        selected
          ? 'border-primary/60 bg-primary/5 shadow-soft'
          : 'border-primary/15 bg-secondary/60 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft',
      )}
    >
      <div className="flex gap-3 p-4">
        {/* Bleu et non or : l'or reste un accent (le surtitre), il ne tient pas
            la chrome principale de la carte (DIRECTION R4). */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
          <HeartHandshake className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardEyebrow className="text-gold-ink">
                {DONATION_TYPE_LABELS[campaign.donation_type] ??
                  campaign.donation_type}
              </CardEyebrow>
              <h3 className="mt-0.5 truncate font-serif text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                {campaign.title}
              </h3>
            </div>
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-background/60 text-transparent group-hover:border-primary/40',
              )}
            >
              <Check className="size-3" />
            </span>
          </div>
          {campaign.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {campaign.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {campaign.target_amount && (
              <span>
                Objectif{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatXof(campaign.target_amount)}
                </span>
              </span>
            )}
            <span className="tabular-nums">
              {campaign.total_donations} don
              {campaign.total_donations > 1 ? 's' : ''}
            </span>
            {campaign.ends_at && <span>Jusqu&apos;au {formatDate(campaign.ends_at)}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
