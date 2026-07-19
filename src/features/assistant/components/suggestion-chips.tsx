'use client';

import { BookOpen, Clock, Heart, MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
  compact?: boolean;
}

const suggestions = [
  {
    icon: BookOpen,
    label: 'Évangile du jour',
    text: 'Quelles sont les lectures du jour ?',
    color: 'text-primary bg-primary/10 hover:bg-primary/15',
  },
  {
    icon: Heart,
    label: 'Chapelet',
    text: "Quels sont les mystères du chapelet d'aujourd'hui ?",
    color: 'text-gold-ink bg-accent/10 hover:bg-accent/15',
  },
  {
    icon: MapPin,
    label: 'Trouver un prêtre',
    text: 'Je cherche un prêtre disponible près de Dakar',
    color: 'text-success bg-success/10 hover:bg-success/15',
  },
  {
    icon: Clock,
    label: 'Prêtre en ligne',
    text: 'Quels prêtres sont disponibles en ce moment ?',
    color: 'text-info bg-info/10 hover:bg-info/15',
  },
];

export function SuggestionChips({ onSelect, compact }: SuggestionChipsProps) {
  if (compact) {
    return (
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSelect(s.text)}
            className={cn(
              // min-h-11 : ces pastilles sont tapées au pouce, pas cliquées
              // à la souris (DIRECTION.md R3, cibles ≥ 44px).
              'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              s.color,
            )}
          >
            <s.icon className="size-3.5" aria-hidden="true" />
            {s.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {suggestions.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onSelect(s.text)}
          className={cn(
            'bg-background-surface hover:bg-background-subtle flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <div
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              s.color,
            )}
          >
            <s.icon className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-base font-semibold text-foreground">
              {s.label}
            </p>
            {/* La question complète est montrée, pas résumée : c'est ce qui
                sera réellement envoyé — l'exemple enseigne quoi demander. */}
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {s.text}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
