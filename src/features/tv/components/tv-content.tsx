'use client';

import { Loader2, Tv } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';

import { useTvCategories } from '../api/get-categories';
import { useTvVideos } from '../api/get-videos';
import type { TvVideo } from '../types';

export function TvContent() {
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(
    undefined,
  );
  const { data: cats, isLoading: catsLoading } = useTvCategories();
  const { data: videos, isLoading: vidsLoading } = useTvVideos(selectedSlug);

  const sortedVideos = useMemo<TvVideo[]>(() => {
    if (!videos?.results) return [];
    return [...videos.results].sort((a, b) => {
      // Pinned live first, then live, then rest
      if (a.is_pinned_live && !b.is_pinned_live) return -1;
      if (!a.is_pinned_live && b.is_pinned_live) return 1;
      if (a.is_live && !b.is_live) return -1;
      if (!a.is_live && b.is_live) return 1;
      return 0;
    });
  }, [videos]);

  return (
    <div className="flex flex-col">
      <PageHeader title="TV Catholique" subtitle="Chaînes et programmes" />

      <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-2 pt-3">
        <button
          type="button"
          onClick={() => setSelectedSlug(undefined)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !selectedSlug
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Tous
        </button>
        {cats?.results.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedSlug(cat.slug)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedSlug === cat.slug
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {(vidsLoading || catsLoading) && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!vidsLoading && !sortedVideos.length && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Tv className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aucune vidéo disponible.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sortedVideos.map((video) => (
            <div key={video.id} className="flex flex-col gap-2">
              <div className="relative">
                {video.is_live && (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    LIVE
                  </span>
                )}
                <iframe
                  src={video.embed_url}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full rounded-xl border border-border bg-black"
                />
              </div>
              {video.title && (
                <p className="text-sm font-medium text-foreground">
                  {video.title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
