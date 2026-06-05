'use client';

import { Play, Tv } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { Spinner } from '@/components/ui/spinner';

import { useTvCategories } from '../api/get-categories';
import { useTvVideos } from '../api/get-videos';
import type { TvVideo } from '../types';

/**
 * Façade cliquable : on n'embarque l'<iframe> qu'au clic, pour ne pas démarrer
 * N lecteurs YouTube en même temps (LCP/INP/bande passante).
 */
function VideoCard({ video }: { video: TvVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {video.is_live && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">
            Live
          </span>
        )}
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
            className="group flex size-full items-center justify-center bg-gradient-to-br from-primary/20 via-background-subtle to-accent/15 transition-colors"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-background/90 text-primary shadow-soft transition-transform group-hover:scale-110 motion-reduce:transform-none">
              <Play className="size-6 translate-x-0.5 fill-current" />
            </span>
          </button>
        )}
      </div>
      {video.title && (
        <p className="text-sm font-medium text-foreground">{video.title}</p>
      )}
    </div>
  );
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

  const filterOptions = [
    { value: '', label: 'Tous' },
    ...(cats?.results.map((c) => ({ value: c.slug, label: c.name })) ?? []),
  ];

  useRegisterPageMeta({
    title: 'TV Catholique',
    subtitle: 'Chaînes et programmes',
  });

  return (
    <div className="flex flex-col">
      <ContentContainer width="wide">
        <div className="mb-4">
          <FilterPills
            options={filterOptions}
            value={selectedSlug}
            onChange={setSelectedSlug}
            ariaLabel="Catégories TV"
          />
        </div>

        {vidsLoading || catsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !sortedVideos.length ? (
          <EmptyState
            icon={<Tv />}
            title="Aucune vidéo"
            description="Aucune vidéo n'est disponible dans cette catégorie."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
