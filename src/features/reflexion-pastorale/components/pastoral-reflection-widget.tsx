'use client';

import { MessageSquareQuote } from 'lucide-react';

import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useTodayReflection } from '../api/get-today-reflection';

export function PastoralReflectionWidget() {
  const { data: reflection, isLoading } = useTodayReflection();

  if (isLoading) {
    return (
      <Card variant="elevated" className="p-4 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </Card>
    );
  }

  if (!reflection) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquareQuote className="size-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Réflexion du jour
        </span>
        {reflection.author_name && (
          <span className="ml-auto text-xs text-muted-foreground">
            {reflection.author_name}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-foreground italic">
        &ldquo;{reflection.content}&rdquo;
      </p>
    </div>
  );
}
