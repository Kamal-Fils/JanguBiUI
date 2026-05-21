'use client';

import { useUser } from '@/lib/auth';

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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-gold/5 p-5 shadow-sm ring-1 ring-primary/15">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-8 -top-8 size-36 rounded-full bg-primary/8 blur-sm" />
        <div className="absolute -right-1 top-12 size-16 rounded-full bg-gold/8" />
        {/* Cross motif */}
        <svg
          className="absolute right-5 top-3 size-20 text-primary/8"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="10" y="2" width="4" height="20" rx="2" />
          <rect x="2" y="8" width="20" height="4" rx="2" />
        </svg>
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
            {greeting}
          </p>
          <h1 className="mt-0.5 truncate font-serif text-3xl font-bold italic text-foreground">
            {firstName || 'Bienvenue'}
          </h1>
          <p className="mt-1 text-xs capitalize text-muted-foreground">
            {dateStr}
          </p>
        </div>
      </div>
    </div>
  );
}
