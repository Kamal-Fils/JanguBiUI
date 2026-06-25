'use client';

import { ChevronRight, Headphones, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useRosaryToday } from '../api/get-rosary-today';

export function DailyMysteryCard() {
  const { data: rosaryData, isLoading, isError } = useRosaryToday();

  if (isLoading) {
    return (
      <Card variant="sacred" className="gap-0 overflow-hidden py-0">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !rosaryData) {
    return (
      <Card variant="sacred" className="gap-0 overflow-hidden py-0">
        <CardContent className="p-4 text-center text-sm text-destructive">
          Erreur lors du chargement du chapelet du jour.
        </CardContent>
      </Card>
    );
  }

  const mysteryName = rosaryData.day.group.name;
  const categoryDay = rosaryData.day.weekday_display;

  return (
    <Card variant="sacred" className="gap-0 overflow-hidden py-0">
      <CardHeader className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 to-accent/15 text-gold ring-1 ring-gold/30">
            <Sparkles className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <CardEyebrow>Chapelet du jour</CardEyebrow>
            <CardTitle className="font-serif text-xl">
              Mystères {mysteryName}
            </CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 bg-gold/15 text-gold hover:bg-gold/20"
          >
            {categoryDay}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <Link
          href="/app/chapelet"
          className="flex items-center justify-between rounded-xl border border-gold/20 bg-background/60 px-4 py-3.5 transition-colors hover:border-gold/40 hover:bg-background"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Headphones className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Commencer le chapelet
              </span>
              <span className="text-xs text-muted-foreground">
                Guide texte et audio
              </span>
            </div>
          </div>
          <ChevronRight className="size-4 text-gold/70" />
        </Link>
      </CardContent>
    </Card>
  );
}
