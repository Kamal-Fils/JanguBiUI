'use client';

import { Newspaper } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { PageHeader } from '@/components/layouts/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';

import { useFeedArticles } from '../api/get-articles';
import type { Article, ContentType } from '../types';

import { ArticleFeedCard } from './article-feed-card';
import { EditorialRule } from './editorial-rule';
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

/**
 * Nombre de bandes pleine largeur avant de basculer en brèves. Au-delà, le fil
 * redeviendrait une répétition — c'est le point où le tempo doit changer.
 */
const BAND_COUNT = 3;

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
  // Miroir du rythme réel : une panoramique → bandes → brèves. Un squelette en
  // grille annoncerait une grille et produirait un saut à l'arrivée des données.
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[4/3] w-full rounded-2xl sm:aspect-video md:aspect-[21/9]" />
      <Skeleton className="mt-4 h-3.5 w-24" />
      <Skeleton className="mt-3 h-8 w-4/5" />
      <Skeleton className="mt-2.5 h-4 w-2/3" />

      <div className="mt-9 flex flex-col gap-6">
        {Array.from({ length: BAND_COUNT }).map((_, i) => (
          <div key={i} className="flex gap-4 md:gap-6">
            <Skeleton className="aspect-[4/3] w-28 shrink-0 rounded-lg sm:w-40 md:w-[38%]" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="mt-2.5 h-6 w-11/12" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FeedRhythmProps {
  articles: Article[];
}

/**
 * Le fil se lit en **trois mouvements**, pas en colonnes :
 *
 * 1. **La une** — visuel panoramique, titre `text-headline`. Elle écrase le reste.
 * 2. **Les bandes** — jusqu'à trois articles pleine largeur, vignette alternée
 *    gauche/droite, séparés par un filet. Aucun n'est côte à côte : la lecture
 *    reste verticale et le regard change de côté à chaque item.
 * 3. **En bref** — le reste en brèves typographiques sans visuel.
 *
 * L'échelle et la densité décroissent d'un mouvement à l'autre : c'est ce qui
 * fait le tempo, et c'est ce qu'une grille de cartes identiques ne peut pas faire.
 */
function FeedRhythm({ articles }: FeedRhythmProps) {
  const [lead, ...others] = articles;
  const bands = others.slice(0, BAND_COUNT);
  const briefs = others.slice(BAND_COUNT);

  return (
    <div className="flex flex-col">
      {lead && <ArticleFeedCard article={lead} variant="lead" />}

      {lead && bands.length > 0 && <EditorialRule className="my-7" />}

      {bands.length > 0 && (
        <div className="flex flex-col">
          {bands.map((article, index) => (
            <div
              key={article.id}
              className={index > 0 ? 'mt-6 border-t border-border pt-6' : ''}
            >
              <ArticleFeedCard
                article={article}
                variant="wide"
                reverse={index % 2 === 1}
              />
            </div>
          ))}
        </div>
      )}

      {briefs.length > 0 && (
        <section className="mt-10" aria-labelledby="feed-briefs-heading">
          <h2
            id="feed-briefs-heading"
            className="font-serif text-lg font-bold tracking-tight text-foreground"
          >
            En bref
          </h2>
          <EditorialRule className="mt-2.5" />
          <ul className="divide-y divide-border">
            {briefs.map((article) => (
              <li key={article.id}>
                <ArticleFeedCard article={article} variant="brief" />
              </li>
            ))}
          </ul>
        </section>
      )}
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

      <ContentContainer>
        {/* Filet bleu au lieu du filet or par défaut : le bleu domine (R4). */}
        <SectionHeader
          eyebrow="La revue"
          title="Le fil de l'Église"
          description="Annonces, articles et lettres pastorales de votre communauté."
          hairline={false}
        />
        <EditorialRule className="-mt-1.5 mb-4" />

        <div className="mb-5">
          <NewsScopeFilter value={scope} onChange={setScope} />
        </div>

        {/* Annonces du dimanche — bloc mis en avant (retour testeurs n°3) */}
        {sundayAnnouncements.length > 0 && (
          <section
            aria-label="Annonces du dimanche"
            className="mb-7 overflow-hidden rounded-2xl border border-primary/25 bg-primary/5"
          >
            <div className="border-b border-primary/20 px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary-foreground dark:text-primary">
                Annonces du dimanche
              </p>
              <p className="font-serif text-xl font-bold capitalize text-foreground">
                {sundayLabel}
              </p>
            </div>
            <div className="flex flex-col divide-y divide-primary/15">
              {sundayAnnouncements.map((a) => (
                <Link
                  key={a.id}
                  href={`/app/actus/${a.id}`}
                  className="group p-4 transition-colors hover:bg-primary/10"
                >
                  <span className="block font-serif text-lg font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline">
                    {a.title}
                  </span>
                  {a.excerpt && (
                    <span className="mt-1 block text-[15px] leading-relaxed text-foreground/75">
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
          <FeedRhythm articles={feedArticles} />
        )}
      </ContentContainer>
    </div>
  );
}
