'use client';

import { Newspaper } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';

import { useFeedArticles } from '../api/get-articles';
import type { ContentType } from '../types';

import { ArticleFeedCard } from './article-feed-card';
import {
  ALL_SCOPE,
  NewsScopeFilter,
  scopeFilterToParams,
  type ScopeFilterValue,
} from './news-scope-filter';

// Filtre par type de contenu (V4-1B1) — état d'URL piloté par la sidebar
// (sous-navs « Actualité » : /app/actus?type=article|announcement|pastoral_letter).
// Le client rejette les onglets dans la page : plus de tablist interne.
const TYPE_PARAM = 'type';

const TYPE_LABELS: Record<ContentType, string> = {
  article: 'Articles',
  announcement: 'Annonces',
  pastoral_letter: 'Lettres pastorales',
};

function isContentType(value: string | null): value is ContentType {
  return (
    value === 'article' ||
    value === 'announcement' ||
    value === 'pastoral_letter'
  );
}

/** Dimanche à venir (aujourd'hui si on est dimanche), au format ISO. */
function upcomingSundayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ArticlesSkeleton() {
  // Miroir de la mise en page presse : une (image large) + grille dense.
  return (
    <div className="flex flex-col">
      <div>
        <Skeleton className="aspect-video w-full rounded-xl md:aspect-[2/1]" />
        <Skeleton className="mt-4 h-3 w-1/4" />
        <Skeleton className="mt-2 h-7 w-3/4" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/2] w-full rounded-xl" />
            <Skeleton className="mt-3 h-3 w-1/3" />
            <Skeleton className="mt-2 h-5 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArticlesFeed() {
  // Fil AGRÉGÉ (Chantier 7b) filtrable par portée : « Tous » = l'agrégat inchangé,
  // sinon le filtre serveur (?scope_type=&scope_id=) restreint à la portée choisie.
  const [scope, setScope] = useState<ScopeFilterValue>(ALL_SCOPE);
  // Filtre par type : lu depuis l'URL (?type=…). Param absent ou inconnu → tout.
  const searchParams = useSearchParams();
  const rawType = searchParams?.get(TYPE_PARAM) ?? null;
  const typeFilter: ContentType | null = isContentType(rawType)
    ? rawType
    : null;
  const { data, isLoading, isError, refetch } = useFeedArticles({
    limit: 20,
    ...scopeFilterToParams(scope),
    ...(typeFilter ? { content_type: typeFilter } : {}),
  });

  const articles = data?.results ?? [];

  // « Annonces du dimanche » : mises en avant en tête de l'onglet Annonces.
  const sundayIso = upcomingSundayIso();
  const sundayAnnouncements =
    typeFilter === 'announcement'
      ? articles.filter((a) => a.announcement_date === sundayIso)
      : [];
  const feedArticles = articles.filter((a) => !sundayAnnouncements.includes(a));
  const [featured, ...rest] = feedArticles;
  const sundayLabel = new Date(`${sundayIso}T00:00:00`).toLocaleDateString(
    'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title={
          typeFilter ? `Actualité — ${TYPE_LABELS[typeFilter]}` : 'Actualité'
        }
        subtitle="La vie de l'Église"
      />

      <div className="mx-auto w-full max-w-2xl p-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        <SectionHeader
          eyebrow="La revue"
          title="Le fil de l'Église"
          description="Annonces, articles et lettres pastorales de votre communauté."
        />

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
          <div className="flex flex-col">
            {/* Une — grand format presse. Absente si toutes les entrées sont
                déjà dans le bloc « Annonces du dimanche » ci-dessus. */}
            {featured && <ArticleFeedCard article={featured} featured />}

            {featured && rest.length > 0 && (
              <div className="hairline-gold my-6" aria-hidden="true" />
            )}

            {/* Cartes secondaires plus denses — grille 2 colonnes en md+ */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
                {rest.map((article) => (
                  <ArticleFeedCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
