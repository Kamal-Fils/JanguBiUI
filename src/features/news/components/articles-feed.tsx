'use client';

import { Clock, Eye, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MediaCard } from '@/components/ui/media-card';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatFrDate } from '@/utils/format-date';

import { useFeedArticles } from '../api/get-articles';
import type { Article, ContentType } from '../types';

import { ArticleTypeBadge } from './article-type-badge';
import {
  ALL_SCOPE,
  NewsScopeFilter,
  scopeFilterToParams,
  type ScopeFilterValue,
} from './news-scope-filter';

// Onglets par type de contenu (retour testeurs n°3) — filtre serveur.
type TypeFilter = 'all' | ContentType;

const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'article', label: 'Articles' },
  { key: 'announcement', label: 'Annonces' },
  { key: 'pastoral_letter', label: 'Lettres pastorales' },
];

/** Dimanche à venir (aujourd'hui si on est dimanche), au format ISO. */
function upcomingSundayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const { data, isLoading, isError, refetch } = useFeedArticles({
    limit: 20,
    ...scopeFilterToParams(scope),
    ...(typeFilter !== 'all' ? { content_type: typeFilter } : {}),
  });

  const articles = data?.results ?? [];

  // « Annonces du dimanche » : mises en avant en tête de l'onglet Annonces.
  const sundayIso = upcomingSundayIso();
  const sundayAnnouncements =
    typeFilter === 'announcement'
      ? articles.filter((a) => a.announcement_date === sundayIso)
      : [];
  const feedArticles = articles.filter(
    (a) => !sundayAnnouncements.includes(a),
  );
  const [featured, ...rest] = feedArticles;
  const sundayLabel = new Date(`${sundayIso}T00:00:00`).toLocaleDateString(
    'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );

  return (
    <div className="flex flex-col">
      <PageHeader title="Actualité" subtitle="La vie de l'Église" />

      <div className="mx-auto w-full max-w-2xl p-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        <SectionHeader
          eyebrow="La revue"
          title="Le fil de l'Église"
          description="Annonces, articles et lettres pastorales de votre communauté."
        />

        {/* Onglets par type de contenu */}
        <div
          role="tablist"
          aria-label="Type de contenu"
          className="mb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={typeFilter === tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                typeFilter === tab.key
                  ? 'bg-primary text-primary-foreground shadow-soft-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <NewsScopeFilter value={scope} onChange={setScope} />
        </div>

        {/* Annonces du dimanche — bloc mis en avant (retour testeurs n°3) */}
        {sundayAnnouncements.length > 0 && (
          <section
            aria-label="Annonces du dimanche"
            className="mb-6 overflow-hidden rounded-2xl border border-gold/30 bg-gold/5"
          >
            <div className="border-b border-gold/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
                Annonces du dimanche
              </p>
              <p className="font-serif text-lg font-bold capitalize text-foreground">
                {sundayLabel}
              </p>
            </div>
            <div className="flex flex-col divide-y divide-gold/15">
              {sundayAnnouncements.map((a) => (
                <Link
                  key={a.id}
                  href={`/app/actus/${a.id}`}
                  className="group px-4 py-3.5 transition-colors hover:bg-gold/10"
                >
                  <span className="block font-serif text-base font-semibold text-foreground">
                    {a.title}
                  </span>
                  {a.excerpt && (
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {a.excerpt}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

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
            {/* Article à la une — absent si toutes les entrées sont déjà dans
                le bloc « Annonces du dimanche » ci-dessus. */}
            {featured && (
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
            )}

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
