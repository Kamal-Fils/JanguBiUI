'use client';

import { ChevronRight, Headphones, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useRosaryToday } from '../api/get-rosary-today';

export function DailyMysteryCard() {
  const { data: rosaryData, isLoading, isError } = useRosaryToday();

  if (isLoading) {
    return (
      <Card className="gap-0 overflow-hidden border-border py-0">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !rosaryData) {
    return (
      <Card className="gap-0 overflow-hidden border-border py-0">
        <CardContent className="p-4 text-center text-sm text-destructive">
          Erreur lors du chargement du chapelet du jour.
        </CardContent>
      </Card>
    );
  }

  const mysteryName = rosaryData.day.group.name;
  const categoryDay = rosaryData.day.weekday_display;

  return (
    <Card className="gap-0 overflow-hidden border-border py-0">
      <CardHeader className="bg-accent/5 p-4 dark:bg-accent/10">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Headphones className="size-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Chapelet du jour</CardTitle>
            <p className="text-xs text-muted-foreground">
              Mystères {mysteryName}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-accent/10 text-accent dark:bg-accent/20"
          >
            {categoryDay}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Link
          href="/app/chapelet"
          className="bg-background-subtle flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-accent/10">
              <Headphones className="size-4 text-accent" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Commencer le chapelet
              </span>
              <span className="text-xs text-muted-foreground">
                Guide texte et audio
              </span>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}
