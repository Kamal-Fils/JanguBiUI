'use client';

import { Play, Radio, Tv } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { CardEyebrow } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { Spinner } from '@/components/ui/spinner';

import { useTvCategories } from '../api/get-categories';
import { useTvVideos } from '../api/get-videos';
import type { TvVideo } from '../types';

/**
 * Extrait l'ID YouTube d'une URL (watch?v=, youtu.be, /embed/, /live/, /shorts/)
 * pour servir une vignette éditoriale sans démarrer le lecteur.
 */
function youtubeThumbnail(video: TvVideo): string | null {
  const source = `${video.youtube_url} ${video.embed_url}`;
  const match =
    source.match(/[?&]v=([\w-]{11})/) ??
    source.match(/youtu\.be\/([\w-]{11})/) ??
    source.match(/\/(?:embed|live|shorts)\/([\w-]{11})/);
  const id = match?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Petit indicateur « EN DIRECT » or, avec point pulsé discret. */
function LiveIndicator() {
  return (
    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-ink shadow-soft-sm backdrop-blur-sm">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold/70 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
      </span>
      En direct
    </span>
  );
}

/**
 * Carte vidéo éditoriale : vignette YouTube riche, surtitre catégorie,
 * titre serif, indicateur or pour les lives. Façade cliquable — on n'embarque
 * l'<iframe> qu'au clic, pour ne pas démarrer N lecteurs en même temps.
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
            className="relative flex size-full items-center justify-center"
          >
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
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
              <Play className="size-6 translate-x-0.5 fill-current" />
            </span>
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        {video.category?.name && (
          <CardEyebrow className="text-gold-ink">
            {video.category.name}
          </CardEyebrow>
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

interface CategorySection {
  slug: string;
  name: string;
  videos: TvVideo[];
}

export function TvContent() {
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const { data: cats, isLoading: catsLoading } = useTvCategories();
  const { data: videos, isLoading: vidsLoading } = useTvVideos(
    selectedSlug || undefined,
  );

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

  const isLoading = vidsLoading || catsLoading;
  const isEmpty = !isLoading && !sortedVideos.length;
  const showGroupedView = !selectedSlug && !isEmpty;

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
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={<Tv />}
            title="Aucune vidéo"
            description="Aucune vidéo n'est disponible dans cette catégorie."
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
