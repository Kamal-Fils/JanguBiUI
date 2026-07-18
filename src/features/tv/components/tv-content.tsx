'use client';

import { Play, Radio, Tv } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Pill } from '@/components/ui/pill';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';

import { useTvCategories } from '../api/get-categories';
import { useTvVideos } from '../api/get-videos';
import type { TvVideo } from '../types';
import { youtubeThumbnail } from '../utils/youtube-thumbnail';

/** Petit indicateur « EN DIRECT » or, avec point pulsé discret. */
function LiveIndicator() {
  return (
    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-ink shadow-soft-sm backdrop-blur-sm">
      <span className="relative flex size-1.5" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold/70 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
      </span>
      En direct
    </span>
  );
}

/**
 * Carte vidéo éditoriale : vignette YouTube 16:9, catégorie en pastille or
 * discrète, titre serif, indicateur or pour les lives. Façade cliquable — on
 * n'embarque l'<iframe> qu'au clic, pour ne pas démarrer N lecteurs en même
 * temps.
 */
function VideoCard({ video }: { video: TvVideo }) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = youtubeThumbnail(video);

  return (
    <article className="group flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-soft-sm transition-shadow duration-[var(--duration-normal)] ease-out-soft group-hover:shadow-soft">
        {video.is_live && <LiveIndicator />}
        {playing ? (
          <iframe
            src={`${video.embed_url}${video.embed_url.includes('?') ? '&' : '?'}autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Lire la vidéo : ${video.title}`}
            className="relative flex size-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04] motion-reduce:transform-none"
              />
            ) : (
              <span className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background-subtle to-accent/20" />
            )}
            {/* Voile dégradé pour ancrer l'icône et faire chanter l'or */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent transition-colors group-hover:from-black/55"
            />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-background/90 text-primary shadow-soft ring-1 ring-gold/30 transition-transform group-hover:scale-110 motion-reduce:transform-none">
              <Play
                className="size-6 translate-x-0.5 fill-current"
                aria-hidden="true"
              />
            </span>
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        {video.category?.name && (
          <Pill tone="gold" className="self-start">
            {video.category.name}
          </Pill>
        )}
        {video.title && (
          <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug text-foreground">
            {video.title}
          </h3>
        )}
      </div>
    </article>
  );
}

function VideoGrid({ videos }: { videos: TvVideo[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

/** Squelette de la grille — mêmes proportions que les cartes (zéro reflow). */
function TvSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CategorySection {
  slug: string;
  name: string;
  videos: TvVideo[];
}

export function TvContent() {
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const {
    data: cats,
    isLoading: catsLoading,
    isError: catsError,
    refetch: refetchCategories,
  } = useTvCategories();
  const {
    data: videos,
    isLoading: vidsLoading,
    isError: vidsError,
    refetch: refetchVideos,
  } = useTvVideos(selectedSlug || undefined);

  const sortedVideos = useMemo<TvVideo[]>(() => {
    if (!videos?.results) return [];
    return [...videos.results].sort((a, b) => {
      if (a.is_pinned_live && !b.is_pinned_live) return -1;
      if (!a.is_pinned_live && b.is_pinned_live) return 1;
      if (a.is_live && !b.is_live) return -1;
      if (!a.is_live && b.is_live) return 1;
      return 0;
    });
  }, [videos]);

  // Lives mis en avant (toutes catégories confondues, vue « Tous »).
  const liveVideos = useMemo<TvVideo[]>(
    () => sortedVideos.filter((v) => v.is_live),
    [sortedVideos],
  );

  // Regroupement par catégorie pour la vue « Tous » (en respectant l'ordre
  // déclaré des catégories), lives exclus pour éviter le doublon.
  const sections = useMemo<CategorySection[]>(() => {
    if (selectedSlug) return [];
    const replayable = sortedVideos.filter((v) => !v.is_live);
    const bySlug = new Map<string, CategorySection>();
    for (const video of replayable) {
      const { slug, name } = video.category;
      if (!bySlug.has(slug)) bySlug.set(slug, { slug, name, videos: [] });
      bySlug.get(slug)!.videos.push(video);
    }
    const order = cats?.results.map((c) => c.slug) ?? [];
    return [...bySlug.values()].sort(
      (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug),
    );
  }, [selectedSlug, sortedVideos, cats]);

  const filterOptions = [
    { value: '', label: 'Tous' },
    ...(cats?.results.map((c) => ({ value: c.slug, label: c.name })) ?? []),
  ];

  const selectedCategory = cats?.results.find((c) => c.slug === selectedSlug);

  const isLoading = vidsLoading || catsLoading;
  const isError = vidsError || catsError;
  const isEmpty = !isLoading && !isError && !sortedVideos.length;
  const showGroupedView = !selectedSlug;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Jàngu Bi TV"
        subtitle="La parole en images — programmes, lives et formations"
      />

      <div className="mx-auto w-full max-w-6xl p-4">
        <div className="mb-6">
          <FilterPills
            options={filterOptions}
            value={selectedSlug}
            onChange={setSelectedSlug}
            ariaLabel="Catégories TV"
          />
        </div>

        {isLoading ? (
          <TvSkeleton />
        ) : isError ? (
          <ErrorState
            title="Impossible de charger les programmes"
            description="Vérifiez votre connexion puis réessayez."
            onRetry={() => {
              refetchCategories();
              refetchVideos();
            }}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={<Tv aria-hidden="true" />}
            title={
              selectedCategory
                ? `Rien dans « ${selectedCategory.name} » pour l'instant`
                : 'Les premiers programmes arrivent'
            }
            description={
              selectedCategory
                ? 'Les prochaines vidéos de cette catégorie apparaîtront ici dès leur mise en ligne. En attendant, explorez le reste de la chaîne.'
                : 'Messes, enseignements, témoignages… La chaîne Jàngu Bi TV se remplit régulièrement. Revenez bientôt pour découvrir les premières vidéos.'
            }
            action={
              selectedCategory ? (
                <Button variant="outline" onClick={() => setSelectedSlug('')}>
                  Voir toutes les vidéos
                </Button>
              ) : undefined
            }
          />
        ) : showGroupedView ? (
          <div className="flex flex-col gap-10">
            {liveVideos.length > 0 && (
              <section>
                <SectionHeader
                  eyebrow="À l'antenne"
                  title="En direct maintenant"
                  description="Suivez les célébrations et événements en direct."
                />
                <VideoGrid videos={liveVideos} />
              </section>
            )}
            {sections.map((section) => (
              <section key={section.slug}>
                <SectionHeader eyebrow="Catégorie" title={section.name} />
                <VideoGrid videos={section.videos} />
              </section>
            ))}
          </div>
        ) : (
          <>
            {liveVideos.length > 0 && (
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-gold-ink">
                <Radio className="size-3.5" aria-hidden="true" />
                {liveVideos.length === 1
                  ? '1 programme en direct'
                  : `${liveVideos.length} programmes en direct`}
              </p>
            )}
            <VideoGrid videos={sortedVideos} />
          </>
        )}
      </div>
    </div>
  );
}
