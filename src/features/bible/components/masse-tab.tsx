'use client';

import { Loader2, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { useLiturgyToday } from '@/features/bible/api/get-liturgy-today';

import { ReadingsSwiper } from './readings-swiper';

export function MasseTab() {
  const { data, isLoading } = useLiturgyToday();
  const [fontSize, setFontSize] = useState(16);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const readings = data?.readings ?? [];

  return (
    <div className="flex flex-col">
      {/* Font size toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          Messe du{' '}
          {data?.date
            ? new Date(data.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : 'jour'}
        </p>
        <div className="flex items-center gap-1">
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
      </div>

      <ReadingsSwiper readings={readings} fontSize={fontSize} />
    </div>
  );
}
