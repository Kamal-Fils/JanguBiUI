'use client';

import { MapPin } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';

import { useFeedArticles } from '../api/get-articles';

import { ArticleCard } from './article-card';
import {
  ALL_SCOPE,
  NewsScopeFilter,
  scopeFilterToParams,
  type ScopeFilterValue,
} from './news-scope-filter';

function ArticlesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-border bg-card p-3"
        >
          <Skeleton className="size-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <MapPin className="size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        Aucune actualité disponible.
      </p>
    </div>
  );
}

export function ArticlesFeed() {
  // Fil AGRÉGÉ (Chantier 7b) filtrable par portée : « Tous » = l'agrégat inchangé,
  // sinon le filtre serveur (?scope_type=&scope_id=) restreint à la portée choisie.
  const [scope, setScope] = useState<ScopeFilterValue>(ALL_SCOPE);
  const { data, isLoading, isError } = useFeedArticles({
    limit: 20,
    ...scopeFilterToParams(scope),
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Actualités" subtitle="La vie de l'Église" />

      <div className="mx-auto w-full max-w-2xl px-4 py-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        <div className="mb-4">
          <NewsScopeFilter value={scope} onChange={setScope} />
        </div>
        {isLoading ? (
          <ArticlesSkeleton />
        ) : isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Impossible de charger les actualités.
          </p>
        ) : !data?.results.length ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {data.results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
