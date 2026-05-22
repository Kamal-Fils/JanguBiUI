'use client';

import { BookOpen, Flame, Tv2 } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

const sections = [
  {
    href: '/app/bible?tab=bible',
    icon: BookOpen,
    label: 'Bible',
    description: 'Lectures du jour · Navigation complète',
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/app/chapelet',
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-6"
      >
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="3" r="1.5" />
        <circle cx="12" cy="21" r="1.5" />
        <circle cx="3" cy="12" r="1.5" />
        <circle cx="21" cy="12" r="1.5" />
        <line x1="12" y1="4.5" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="19.5" />
        <line x1="4.5" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="19.5" y2="12" />
      </svg>
    ),
    label: 'Chapelet',
    description: 'Mystère du jour · Guide de prière',
    color: 'bg-accent/10 text-accent',
  },
  {
    href: paths.app.spirituelLiturgie.getHref(),
    icon: Flame,
    label: 'Liturgie du Jour',
    description: 'Lectures · Évangile · Messe du jour',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    href: paths.app.spirituelHeures.getHref(),
    icon: Flame,
    label: 'Liturgie des Heures',
    description: 'Laudes · Vêpres · Complies · 7 offices',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    href: paths.app.tv.getHref(),
    icon: Tv2,
    label: 'TV Catholique',
    description: 'En direct · Replays par catégorie',
    color: 'bg-purple-500/10 text-purple-500',
  },
];

export function SpirituelContent() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Spiritualité"
        subtitle="Nourriture de l'âme au quotidien"
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        <div className="flex flex-col gap-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted active:scale-[0.98]"
              >
                <div
                  className={cn(
                    'flex size-12 flex-shrink-0 items-center justify-center rounded-xl',
                    section.color,
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {section.label}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <svg
                  className="size-4 flex-shrink-0 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
