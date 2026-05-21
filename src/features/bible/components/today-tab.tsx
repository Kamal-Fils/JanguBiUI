'use client';

import { ChevronLeft, ChevronRight, Calendar, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { useLiturgyToday } from '@/features/bible/api/get-liturgy-today';
import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';

import { ReadingsSwiper } from './readings-swiper';

export function TodayTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fontSize, setFontSize] = useState(16);
  const { data, isLoading } = useLiturgyToday(currentDate);

  const dateStr = data?.date
    ? new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

  const navigateDay = (offset: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + offset);
    setCurrentDate(next);
  };

  const readings = data?.readings ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigateDay(-1)}
          aria-label="Jour précédent"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium capitalize text-foreground">
          <Calendar className="size-4 text-muted-foreground" />
          {dateStr}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigateDay(1)}
          aria-label="Jour suivant"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Rosary mystery card */}
      <DailyMysteryCard />

      {/* Season / mystery label */}
      {(data?.season || data?.mystery) && (
        <p className="px-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {[data.season, data.mystery].filter(Boolean).join(' — ')}
        </p>
      )}

      {/* Font size controls */}
      {!isLoading && readings.length > 0 && (
        <div className="flex items-center justify-end gap-1 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setFontSize((s) => Math.max(12, s - 2))}
            aria-label="Réduire la taille du texte"
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-6 text-center text-xs text-muted-foreground">
            {fontSize}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setFontSize((s) => Math.min(24, s + 2))}
            aria-label="Augmenter la taille du texte"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Swipeable readings */}
      <ReadingsSwiper readings={readings} fontSize={fontSize} />
    </div>
  );
}
