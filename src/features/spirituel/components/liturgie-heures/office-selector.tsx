'use client';

import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';

import { cn } from '@/lib/utils';

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
}

export function OfficeSelector({ selected, onChange }: OfficeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {OFFICES.map((office) => {
        const Icon = office.icon;
        const isActive = selected === office.key;
        return (
          <button
            key={office.key}
            type="button"
            onClick={() => onChange(office.key)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
              isActive
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/50',
            )}
          >
            <div className="flex w-full items-center justify-between">
              <Icon className="size-4" />
              <span className="text-xs opacity-60">{office.time}</span>
            </div>
            <span className="text-sm font-semibold leading-tight">
              {office.label}
            </span>
            <span className="text-xs opacity-70">{office.subtitle}</span>
          </button>
        );
      })}
    </div>
  );
}

export { OFFICES };
export type { OfficeMeta };
