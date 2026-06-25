'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { FontSizeStepper } from '@/components/ui/font-size-stepper';
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
      {/* Date navigator — bloc éditorial centré, flanqué de deux boutons fantômes */}
      <div className="flex items-center justify-center gap-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 rounded-full text-muted-foreground"
          onClick={() => navigateDay(-1)}
          aria-label="Jour précédent"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="min-w-0 text-center">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
            Lectures liturgiques
          </p>
          <p className="font-serif text-lg font-bold capitalize text-foreground">
            {dateStr}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 rounded-full text-muted-foreground"
          onClick={() => navigateDay(1)}
          aria-label="Jour suivant"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Rosary mystery card */}
      <DailyMysteryCard />

      {/* Season / mystery label + font controls on one row */}
      <div className="flex items-center justify-between gap-2 px-1">
        {data?.season || data?.mystery ? (
          <p className="min-w-0 truncate text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {[data.season, data.mystery].filter(Boolean).join(' — ')}
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
        {!isLoading && readings.length > 0 && (
          <FontSizeStepper
            value={fontSize}
            onChange={setFontSize}
            min={12}
            max={24}
            className="shrink-0"
          />
        )}
      </div>

      {/* Swipeable readings */}
      <ReadingsSwiper readings={readings} fontSize={fontSize} />
    </div>
  );
}
