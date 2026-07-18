'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeReadingLabel } from '@/utils/reading-labels';

import { useDailyReadings } from './api/get-daily-readings';

/**
 * Lectures du jour du dashboard — branchées sur l'API liturgie (retour
 * testeurs n°1 : les références étaient codées en dur et divergeaient de la
 * vraie page de lecture).
 */
export function DailyReadingCard() {
  // isPending couvre aussi la query désactivée (user pas encore chargé) —
  // avec isLoading, l'état vide flashait avant la première requête.
  const { data, isPending } = useDailyReadings();

  // L'alléluia est une acclamation, pas une « lecture » à lister ici.
  const readings = (data?.readings ?? []).filter((r) => {
    const label = normalizeReadingLabel(r.type ?? '');
    return (r.type || r.citation) && !/all[eé]luia/i.test(label);
  });
  const seasonLine = [data?.season, data?.day_name].filter(Boolean).join(' — ');

  return (
    <Card variant="feature">
      {/* En-tête éditorial */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="min-w-0">
          <CardEyebrow>Lectures du Jour</CardEyebrow>
          <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-foreground">
            La Parole du jour
          </h2>
          {seasonLine && (
            <p className="mt-0.5 text-xs text-muted-foreground">{seasonLine}</p>
          )}
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 border-gold/25 bg-gold/10 font-medium text-gold-ink"
        >
          Aujourd&apos;hui
        </Badge>
      </div>

      {isPending && (
        <div className="flex flex-col gap-4 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      )}

      {!isPending && readings.length === 0 && (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          Les lectures du jour ne sont pas encore disponibles.{' '}
          <Link
            href="/app/bible?tab=aujourdhui"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Ouvrir la Bible
          </Link>
        </p>
      )}

      <div className="flex flex-col divide-y divide-border/50">
        {readings.map((reading) => {
          const label = normalizeReadingLabel(reading.type ?? '') || 'Lecture';
          return (
            <Link
              key={reading.id}
              href="/app/bible?tab=aujourdhui"
              className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-4">
                {/* Marqueur or */}
                <div className="h-10 w-1 rounded-full bg-gold/35 transition-colors group-hover:bg-gold" />
                <div>
                  <span className="block font-serif text-base font-semibold text-foreground">
                    {label}
                  </span>
                  {reading.citation && (
                    <span className="block text-xs text-muted-foreground">
                      {reading.citation}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-gold" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
