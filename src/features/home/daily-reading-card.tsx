'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardEyebrow } from '@/components/ui/card/card';

const todayReadings = [
  { label: '1ère Lecture', ref: 'Isaïe 55, 10-11', type: 'lecture' },
  { label: 'Psaume', ref: 'Ps 33 (34)', type: 'psaume' },
  { label: 'Évangile', ref: 'Matthieu 6, 7-15', type: 'evangile' },
];

export function DailyReadingCard() {
  return (
    <Card variant="feature">
      {/* En-tête éditorial */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="min-w-0">
          <CardEyebrow>Lectures du Jour</CardEyebrow>
          <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-foreground">
            La Parole du jour
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Temps ordinaire — Semaine XII
          </p>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 border-gold/25 bg-gold/10 font-medium text-gold"
        >
          Aujourd&apos;hui
        </Badge>
      </div>

      <div className="flex flex-col divide-y divide-border/50">
        {todayReadings.map((reading) => (
          <Link
            key={reading.label}
            href="/app/bible"
            className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-4">
              {/* Marqueur or */}
              <div className="h-10 w-1 rounded-full bg-gold/35 transition-colors group-hover:bg-gold" />
              <div>
                <span className="block font-serif text-base font-semibold text-foreground">
                  {reading.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {reading.ref}
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-gold" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
