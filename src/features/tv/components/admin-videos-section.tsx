'use client';

import {
  MonitorPlay,
  MoreHorizontal,
  Pencil,
  Radio,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Card, CardContent } from '@/components/ui/card/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/utils/cn';

import { useDeleteVideo } from '../api/delete-video';
import { useTvCategories } from '../api/get-categories';
import { useTvVideos } from '../api/get-videos';
import type { TvVideo } from '../types';
import { youtubeThumbnail } from '../utils/youtube-thumbnail';

import { VideoForm } from './video-form';

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function VideoThumb({ video }: { video: TvVideo }) {
  const thumbnail = youtubeThumbnail(video);
  if (thumbnail) {
    return (
      <Image
        src={thumbnail}
        alt=""
        width={72}
        height={40}
        unoptimized
        className="hidden h-10 w-[4.5rem] shrink-0 rounded-md border border-border/60 object-cover md:block"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="hidden h-10 w-[4.5rem] shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-accent/10 text-primary/40 md:flex"
    >
      <MonitorPlay className="size-4" />
    </div>
  );
}

interface VideoRowActionsProps {
  video: TvVideo;
  onEdit: (video: TvVideo) => void;
  onDeleteRequest: (video: TvVideo) => void;
}

/** Actions par ligne regroupées dans un menu « ⋯ » (pas de rangée de boutons). */
function VideoRowActions({
  video,
  onEdit,
  onDeleteRequest,
}: VideoRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour ${video.title || 'la vidéo sans titre'}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onEdit(video)}>
          <Pencil className="mr-2 size-4" aria-hidden="true" />
          Éditer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => onDeleteRequest(video)}
        >
          <Trash2 className="mr-2 size-4" aria-hidden="true" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Section admin « Vidéos » : DataTable + menu « ⋯ » par ligne, formulaire de
 * création/édition repliable, confirmation de suppression en Dialog.
 * La logique métier (mutations, invalidations) est inchangée.
 */
export function AdminVideosSection() {
  const { data: cats } = useTvCategories();
  const { data: videos, isLoading, isError, refetch } = useTvVideos();
  const [editingVideo, setEditingVideo] = useState<TvVideo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TvVideo | null>(null);

  const deleteMutation = useDeleteVideo({
    onSuccess: () => setDeleteTarget(null),
  });

  const categories = cats?.results ?? [];

  const startCreate = () => {
    setEditingVideo(null);
    setShowForm((v) => !v);
  };

  const openCreate = () => {
    setEditingVideo(null);
    setShowForm(true);
  };

  const startEdit = (video: TvVideo) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVideo(null);
  };

  const columns: DataTableColumn<TvVideo>[] = [
    {
      header: 'Vidéo',
      mobileLabel: 'Titre',
      headClassName: TH_CLASS,
      cell: (v) => (
        <div className="flex min-w-0 items-center gap-3">
          <VideoThumb video={v} />
          <div className="min-w-0">
            <p className="line-clamp-1 font-serif text-sm font-semibold text-foreground">
              {v.title || '(sans titre)'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {v.youtube_url}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Catégorie',
      headClassName: TH_CLASS,
      cell: (v) => (
        <span className="text-sm text-muted-foreground">{v.category.name}</span>
      ),
    },
    {
      header: 'État',
      headClassName: TH_CLASS,
      cell: (v) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5 md:justify-start">
          {v.is_live && (
            <StatusBadge
              tone="danger"
              label="Live"
              icon={<Radio aria-hidden="true" />}
            />
          )}
          {v.is_pinned_live && <StatusBadge tone="warning" label="Épinglé" />}
          {!v.is_live && !v.is_pinned_live && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (v) => (
        <VideoRowActions
          video={v}
          onEdit={startEdit}
          onDeleteRequest={setDeleteTarget}
        />
      ),
    },
  ];

  return (
    <Card variant="feature">
      <CardContent className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Programmes"
          title="Vidéos"
          action={
            <Button size="sm" variant="outline-gold" onClick={startCreate}>
              {showForm && !editingVideo ? 'Annuler' : '+ Vidéo'}
            </Button>
          }
        />

        {showForm && (
          <div className="mb-4">
            <VideoForm
              key={editingVideo?.id ?? 'new'}
              categories={categories}
              video={editingVideo ?? undefined}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </div>
        )}

        {isError ? (
          <ErrorState
            title="Impossible de charger les vidéos"
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable
            data={videos?.results}
            columns={columns}
            rowKey={(v) => v.id}
            isLoading={isLoading}
            caption="Liste des vidéos TV"
            emptyState={
              <EmptyState
                icon={<MonitorPlay aria-hidden="true" />}
                title="Ajoutez votre première vidéo"
                description="Collez un lien YouTube pour diffuser une messe, un enseignement ou un direct sur Jàngu Bi TV."
                action={<Button onClick={openCreate}>Ajouter une vidéo</Button>}
              />
            }
          />
        )}

        {/* Confirmation de suppression */}
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer cette vidéo&nbsp;?</DialogTitle>
              <DialogDescription>
                «&nbsp;{deleteTarget?.title || 'Vidéo sans titre'}&nbsp;» sera
                définitivement retirée de JanguBi TV. Cette action est
                irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  deleteTarget && deleteMutation.mutate(deleteTarget.id)
                }
                isLoading={deleteMutation.isPending}
              >
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
