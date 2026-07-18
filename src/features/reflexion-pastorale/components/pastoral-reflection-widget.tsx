'use client';

import { MessageSquareQuote, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useTodayReflection } from '../api/get-today-reflection';

export function PastoralReflectionWidget() {
  const {
    data: reflection,
    isLoading,
    isError,
    refetch,
  } = useTodayReflection();

  if (isLoading) {
    return (
      <Card variant="elevated" className="space-y-2 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </Card>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      >
        <p className="text-sm text-muted-foreground">
          Impossible de charger la réflexion du jour.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RotateCw className="size-3.5" aria-hidden="true" />}
          onClick={() => refetch()}
          className="shrink-0"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // Pas de réflexion publiée aujourd'hui : le widget s'efface (état normal,
  // pas d'encart vide qui alourdirait le tableau de bord).
  if (!reflection) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <MessageSquareQuote
          className="size-4 text-primary"
          aria-hidden="true"
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Réflexion du jour
        </span>
        {reflection.author_name && (
          <span className="ml-auto text-xs text-muted-foreground">
            {reflection.author_name}
          </span>
        )}
      </div>
      <p className="text-sm italic leading-relaxed text-foreground">
        &ldquo;{reflection.content}&rdquo;
      </p>
    </div>
  );
}
