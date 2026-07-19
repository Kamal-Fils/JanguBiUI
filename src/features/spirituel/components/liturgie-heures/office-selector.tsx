'use client';

import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';

import { cn } from '@/utils/cn';

import type { OfficeKey } from '../../api/get-office';

interface OfficeMeta {
  key: OfficeKey;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  time: string;
}

const OFFICES: OfficeMeta[] = [
  {
    key: 'lectures',
    label: 'Office des Lectures',
    subtitle: 'Vigiles',
    icon: Moon,
    time: '00:00',
  },
  {
    key: 'laudes',
    label: 'Laudes',
    subtitle: 'Prière du matin',
    icon: Sunrise,
    time: '06:00',
  },
  {
    key: 'tierce',
    label: 'Tierce',
    subtitle: 'Petite heure',
    icon: Sun,
    time: '09:00',
  },
  {
    key: 'sexte',
    label: 'Sexte',
    subtitle: 'Milieu du jour',
    icon: Sun,
    time: '12:00',
  },
  {
    key: 'none',
    label: 'None',
    subtitle: 'Petite heure',
    icon: Sun,
    time: '15:00',
  },
  {
    key: 'vepres',
    label: 'Vêpres',
    subtitle: 'Prière du soir',
    icon: Sunset,
    time: '18:00',
  },
  {
    key: 'complies',
    label: 'Complies',
    subtitle: 'Prière de nuit',
    icon: Moon,
    time: '21:00',
  },
];

interface OfficeSelectorProps {
  selected: OfficeKey;
  onChange: (key: OfficeKey) => void;
  /** Office correspondant à l'heure courante — signalé « maintenant ». */
  currentKey?: OfficeKey;
}

/**
 * Choix de l'heure. Le bleu porte la sélection (identité + action) ; l'office
 * de l'heure courante est signalé par un mot, pas par la seule couleur
 * (WCAG 1.4.1). Cibles ≥ 44px (R3).
 */
export function OfficeSelector({
  selected,
  onChange,
  currentKey,
}: OfficeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Choisir un office"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {OFFICES.map((office) => {
        const Icon = office.icon;
        const isActive = selected === office.key;
        const isNow = currentKey === office.key;

        return (
          <button
            key={office.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(office.key)}
            className={cn(
              'flex min-h-[4.25rem] flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50',
            )}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  'text-xs tabular-nums',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {isNow ? 'maintenant' : office.time}
              </span>
            </div>
            <span className="text-sm font-semibold leading-tight">
              {office.label}
            </span>
            <span
              className={cn(
                'text-xs',
                isActive ? 'text-primary/80' : 'text-muted-foreground',
              )}
            >
              {office.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { OFFICES };
export type { OfficeMeta };
