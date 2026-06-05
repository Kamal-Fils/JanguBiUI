'use client';

import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card/card';

const todayReadings = [
  { label: '1ère Lecture', ref: 'Isaïe 55, 10-11', type: 'lecture' },
  { label: 'Psaume', ref: 'Ps 33 (34)', type: 'psaume' },
  { label: 'Évangile', ref: 'Matthieu 6, 7-15', type: 'evangile' },
];

export function DailyReadingCard() {
  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Gold accent strip */}
      <div className="h-0.5 bg-gradient-to-r from-gold via-gold/50 to-transparent" />

      <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-gold/8 to-transparent p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 ring-1 ring-gold/20">
          <BookOpen className="size-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold text-foreground">
            Lectures du jour
          </p>
          <p className="text-xs text-muted-foreground">
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
            className="group flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-1 rounded-full bg-gold/35 transition-colors group-hover:bg-gold" />
              <div>
                <span className="block text-sm font-semibold text-foreground">
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
