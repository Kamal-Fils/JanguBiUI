'use client';

import { BookOpen, ScrollText } from 'lucide-react';
import Link from 'next/link';

import { useUser } from '@/lib/auth';

// Pastilles d'action rapide affichées dans le hero éditorial.
const HERO_ACTIONS = [
  { label: 'Spiritualité', href: '/app/spirituel', icon: BookOpen },
  { label: 'Intentions', href: '/app/intentions', icon: ScrollText },
] as const;

export function WelcomeBanner() {
  const { data: user } = useUser();

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const firstName = user?.profile?.first_name ?? '';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/85 p-7 text-primary-foreground shadow-glow-indigo motion-safe:animate-slide-up sm:p-9">
      {/* Décor : grain subtil + grande croix filigrane, purement décoratif */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(currentColor 0.6px, transparent 0.6px)',
            backgroundSize: '14px 14px',
          }}
        />
        <svg
          className="absolute -right-6 -top-10 size-56 text-primary-foreground/10 sm:size-64"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="10" y="2" width="4" height="20" rx="2" />
          <rect x="2" y="8" width="20" height="4" rx="2" />
        </svg>
      </div>

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/85">
          {greeting}
        </p>
        <h1 className="mt-1 truncate font-serif text-display font-black italic leading-[0.95] text-primary-foreground">
          {firstName || 'Bienvenue'}
        </h1>

        {/* Filet or court sous le nom */}
        <div className="mt-4 h-px w-16 rounded-full bg-gold/70" aria-hidden="true" />

        <p className="mt-3 text-sm capitalize text-primary-foreground/85">
          {dateStr}
        </p>

        {/* Pastilles d'action rapide */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {HERO_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground ring-1 ring-inset ring-primary-foreground/15 backdrop-blur-sm transition-all hover:bg-primary-foreground/20 active:scale-[0.97] motion-reduce:transform-none"
              >
                <Icon className="size-4 text-gold" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
