'use client';

import { Clock, Eye, Newspaper } from 'lucide-react';
import { useState } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MediaCard } from '@/components/ui/media-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFrDate } from '@/utils/format-date';

import { useFeedArticles } from '../api/get-articles';
import type { Article } from '../types';

import { ArticleTypeBadge } from './article-type-badge';
import {
  ALL_SCOPE,
  NewsScopeFilter,
  scopeFilterToParams,
  type ScopeFilterValue,
} from './news-scope-filter';

function ArticlesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function articleMeta(article: Article) {
  return (
    <div className="flex items-center gap-3">
      {article.published_at && (
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {formatFrDate(article.published_at, 'short')}
        </span>
      )}
      <span className="flex items-center gap-1">
        <Eye className="size-3" />
        {article.views_count}
      </span>
    </div>
  );
}

export function ArticlesFeed() {
  // Fil AGRÉGÉ (Chantier 7b) filtrable par portée : « Tous » = l'agrégat inchangé,
  // sinon le filtre serveur (?scope_type=&scope_id=) restreint à la portée choisie.
  const [scope, setScope] = useState<ScopeFilterValue>(ALL_SCOPE);
  const { data, isLoading, isError, refetch } = useFeedArticles({
    limit: 20,
    ...scopeFilterToParams(scope),
  });

  const articles = data?.results ?? [];
  const [featured, ...rest] = articles;

  useRegisterPageMeta({ title: 'Actualités', subtitle: "La vie de l'Église" });

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-2xl p-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        <div className="mb-4">
          <NewsScopeFilter value={scope} onChange={setScope} />
        </div>

        {isLoading ? (
          <ArticlesSkeleton />
        ) : isError ? (
          <ErrorState
            title="Impossible de charger les actualités"
            onRetry={() => refetch()}
          />
        ) : !articles.length ? (
          <EmptyState
            icon={<Newspaper />}
            title="Aucune actualité"
            description="Aucune actualité n'est disponible pour cette portée."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Article à la une */}
            <MediaCard
              featured
              href={`/app/actus/${featured.id}`}
              image={featured.cover_image_url}
              imageAlt={featured.title}
              aspect="wide"
              fallbackIcon={<Newspaper />}
              overline={
                <>
                  <ArticleTypeBadge contentType={featured.content_type} />
                  {featured.category && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {featured.category.name}
                    </span>
                  )}
                </>
              }
              title={featured.title}
              excerpt={featured.excerpt ?? undefined}
              meta={articleMeta(featured)}
            />

            {/* Reste — grille 2 colonnes en md+ */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {rest.map((article) => (
                  <MediaCard
                    key={article.id}
                    href={`/app/actus/${article.id}`}
                    image={article.cover_image_url}
                    imageAlt={article.title}
                    aspect="video"
                    fallbackIcon={<Newspaper />}
                    overline={
                      <ArticleTypeBadge contentType={article.content_type} />
                    }
                    title={article.title}
                    excerpt={article.excerpt ?? undefined}
                    meta={articleMeta(article)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
