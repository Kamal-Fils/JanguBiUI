'use client';

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  HandHeart,
  HeartHandshake,
  MessageCircle,
  Play,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { paths } from '@/config/paths';

/**
 * « Tout au même endroit » — l'avantage produit rendu visible.
 *
 * L'AELF fait très bien les lectures du jour ; sur ce terrain nous sommes au
 * mieux à égalité. Ce qui nous distingue, ce sont les **modules** : demander un
 * acte de baptême sans passer au secrétariat, écrire à son curé, confier une
 * intention. Un accueil qui ne raconterait que la lecture rendrait cet avantage
 * invisible (DIRECTION §1).
 *
 * D'où la hiérarchie : deux entrées porteuses en grand — celles qu'aucune app
 * de lectures ne propose — puis les autres modules en pastilles compactes. Pas
 * une grille uniforme où rien n'indique ce qui compte (DIRECTION R6, « Flux »).
 */

const LEAD_ACTIONS = [
  {
    href: paths.app.newDocument.getHref(),
    icon: FileText,
    label: 'Demander un document',
    description: 'Baptême, mariage, confirmation — sans passer au secrétariat.',
  },
  {
    href: paths.app.messages.getHref(),
    icon: MessageCircle,
    label: 'Écrire à mon curé',
    description: 'Une conversation privée avec le clergé de ma paroisse.',
  },
] as const;

const SECONDARY_ACTIONS = [
  { href: paths.app.intentions.getHref(), icon: HandHeart, label: 'Intentions' },
  { href: paths.app.agenda.getHref(), icon: CalendarDays, label: 'Agenda' },
  { href: paths.app.chapelet.getHref(), icon: Sparkles, label: 'Chapelet' },
  { href: paths.app.bible.getHref(), icon: BookOpen, label: 'Bible' },
  { href: paths.app.spirituelHeures.getHref(), icon: Clock, label: 'Les Heures' },
  { href: paths.app.dons.getHref(), icon: HeartHandshake, label: 'Dons' },
  { href: paths.app.tv.getHref(), icon: Play, label: 'Jàngu Bi TV' },
] as const;

export function ModuleShortcuts() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {LEAD_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.07] p-4 shadow-soft-sm transition-[transform,box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft motion-reduce:transform-none"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft-sm">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-base font-bold leading-snug text-foreground">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-2">
        {SECONDARY_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <Link
                href={action.href}
                className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors duration-[var(--duration-fast)] hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {action.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
