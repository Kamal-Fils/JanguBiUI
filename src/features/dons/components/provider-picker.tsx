'use client';

import { Check } from 'lucide-react';

import { Pill } from '@/components/ui/pill';
import { cn } from '@/utils/cn';

/**
 * Providers de paiement. Le paiement en ligne (wave / orange_money /
 * free_money) est volontairement désactivé tant que l'IPN (5b) n'est pas
 * livré : le back rejette ces providers (garde 5a). Seules les espèces sont
 * actives.
 */
export const PAYMENT_PROVIDERS = [
  { value: 'cash', label: 'Espèces', online: false },
  { value: 'wave', label: 'Wave', online: true },
  { value: 'orange_money', label: 'Orange Money', online: true },
  { value: 'free_money', label: 'Free Money', online: true },
];

interface ProviderPickerProps {
  /** Valeur sélectionnée (`payment_provider`). */
  value: string;
  onChange: (value: string) => void;
  /** Id de l'élément qui étiquette le groupe (label visible). */
  labelledBy: string;
}

/**
 * Sélecteur de méthode de paiement — cartes radio designées. Les providers en
 * ligne désactivés sont présentés proprement avec un badge « Bientôt
 * disponible » plutôt qu'une option morte.
 */
export function ProviderPicker({
  value,
  onChange,
  labelledBy,
}: ProviderPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {PAYMENT_PROVIDERS.map((p) => {
        const isSelected = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={p.online}
            onClick={() => onChange(p.value)}
            className={cn(
              'flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-[border-color,background-color,box-shadow] duration-[var(--duration-normal)] ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected
                ? 'border-primary bg-primary/5 text-foreground shadow-soft-sm'
                : 'border-border/60 bg-background text-foreground hover:border-primary/40 hover:bg-muted/40',
              p.online &&
                'cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground',
            )}
          >
            <span className="min-w-0 truncate">{p.label}</span>
            {p.online ? (
              <Pill tone="gold" className="shrink-0">
                Bientôt disponible
              </Pill>
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border',
                )}
              >
                {isSelected && <Check className="size-3" />}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
