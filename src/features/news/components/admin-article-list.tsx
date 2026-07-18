'use client';

import {
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  MoreHorizontal,
  Newspaper,
  Pencil,
  PencilLine,
  Send,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
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
import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { canPublishArticle, canUnpublishArticle } from '@/lib/authorization';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { useDeleteArticle } from '../api/delete-article';
import { usePublishArticle } from '../api/publish-article';
import { useUnpublishArticle } from '../api/unpublish-article';
import { Article, ArticleStatus } from '../types';

import { ArticleTypeBadge } from './article-type-badge';

/** Statut éditorial → StatusBadge tonal (icône + libellé, jamais couleur seule). */
const STATUS_CONFIG: Record<ArticleStatus, StatusConfig> = {
  draft: { label: 'Brouillon', tone: 'warning', icon: <PencilLine /> },
  published: { label: 'Publié', tone: 'success', icon: <CheckCircle2 /> },
  unpublished: { label: 'Dépublié', tone: 'danger', icon: <EyeOff /> },
};

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function ArticleCoverThumb({ article }: { article: Article }) {
  if (article.cover_image_url) {
    return (
      <Image
        src={article.cover_image_url}
        alt=""
        width={56}
        height={40}
        unoptimized
        className="hidden h-10 w-14 shrink-0 rounded-md border border-border/60 object-cover md:block"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="hidden h-10 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-accent/10 text-primary/40 md:flex"
    >
      <ImageIcon className="size-4" />
    </div>
  );
}

interface ArticleRowActionsProps {
  article: Article;
  userCanPublish: boolean;
  userCanUnpublish: boolean;
  publishPending: boolean;
  onPublish: (id: string) => void;
  onUnpublishRequest: (article: Article) => void;
  onDeleteRequest: (article: Article) => void;
}

/** Actions par ligne regroupées dans un menu « ⋯ » (pas de rangée de boutons). */
function ArticleRowActions({
  article,
  userCanPublish,
  userCanUnpublish,
  publishPending,
  onPublish,
  onUnpublishRequest,
  onDeleteRequest,
}: ArticleRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions pour ${article.title}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={paths.app.article.getHref(article.id)} target="_blank">
            <Eye className="mr-2 size-4" aria-hidden="true" />
            Voir
          </Link>
        </DropdownMenuItem>
        {article.status !== 'unpublished' && (
          <DropdownMenuItem asChild>
            <Link href={paths.app.admin.articleEdit.getHref(article.id)}>
              <Pencil className="mr-2 size-4" aria-hidden="true" />
              Modifier
            </Link>
          </DropdownMenuItem>
        )}
        {article.status === 'draft' && userCanPublish && (
          <DropdownMenuItem
            disabled={publishPending}
            onSelect={() => onPublish(article.id)}
          >
            <Send className="mr-2 size-4" aria-hidden="true" />
            Publier
          </DropdownMenuItem>
        )}
        {article.status === 'published' && userCanUnpublish && (
          <DropdownMenuItem onSelect={() => onUnpublishRequest(article)}>
            <EyeOff className="mr-2 size-4" aria-hidden="true" />
            Dépublier
          </DropdownMenuItem>
        )}
        {article.status !== 'published' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => onDeleteRequest(article)}
            >
              <Trash2 className="mr-2 size-4" aria-hidden="true" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AdminArticleListProps {
  articles: Article[];
  isLoading?: boolean;
}

export function AdminArticleList({
  articles,
  isLoading,
}: AdminArticleListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<Article | null>(null);

  // Aligne l'UI sur l'API : un diacre (church_admin) gère ses brouillons mais
  // ne peut ni publier ni dépublier. On masque les actions correspondantes pour
  // éviter une action morte (le back renverrait 400/403).
  const { data: user } = useUser();
  const userCanPublish = canPublishArticle(user);
  const userCanUnpublish = canUnpublishArticle(user);

  const publishMutation = usePublishArticle();
  const unpublishMutation = useUnpublishArticle();
  const deleteMutation = useDeleteArticle({
    onSuccess: () => setDeleteTarget(null),
  });

  const columns: DataTableColumn<Article>[] = [
    {
      header: 'Article',
      mobileLabel: 'Titre',
      headClassName: TH_CLASS,
      cell: (article) => (
        <div className="flex min-w-0 items-center gap-3">
          <ArticleCoverThumb article={article} />
          <div className="min-w-0">
            <p className="line-clamp-1 font-serif text-sm font-semibold text-foreground">
              {article.title}
            </p>
            {article.author_name && (
              <p className="truncate text-xs text-muted-foreground">
                par {article.author_name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      headClassName: TH_CLASS,
      cell: (article) => <ArticleTypeBadge contentType={article.content_type} />,
    },
    {
      header: 'Statut',
      headClassName: TH_CLASS,
      cell: (article) => (
        <StatusBadge
          {...(STATUS_CONFIG[article.status] ?? STATUS_CONFIG.draft)}
        />
      ),
    },
    {
      header: 'Catégorie',
      headClassName: TH_CLASS,
      hideOnMobile: true,
      cell: (article) => (
        <span className="text-sm text-muted-foreground">
          {article.category?.name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Publié le',
      mobileLabel: 'Publié le',
      headClassName: TH_CLASS,
      cell: (article) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {article.published_at
            ? formatFrDate(article.published_at, 'short')
            : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (article) => (
        <ArticleRowActions
          article={article}
          userCanPublish={userCanPublish}
          userCanUnpublish={userCanUnpublish}
          publishPending={publishMutation.isPending}
          onPublish={(id) => publishMutation.mutate(id)}
          onUnpublishRequest={setUnpublishTarget}
          onDeleteRequest={setDeleteTarget}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={articles}
        columns={columns}
        rowKey={(article) => article.id}
        isLoading={isLoading}
        caption="Liste des articles"
        emptyState={
          <EmptyState
            icon={<Newspaper />}
            title="Aucun article"
            description="Aucun article ne correspond à ce filtre pour le moment."
          />
        }
      />

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;article</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deleteTarget?.title}
              &quot; ? Cette action est irréversible.
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

      {/* Unpublish dialog */}
      <Dialog
        open={!!unpublishTarget}
        onOpenChange={(open) => !open && setUnpublishTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dépublier l&apos;article</DialogTitle>
            <DialogDescription>
              L&apos;article &quot;{unpublishTarget?.title}&quot; sera retiré de
              la publication.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpublishTarget(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (unpublishTarget) {
                  unpublishMutation.mutate(
                    { id: unpublishTarget.id },
                    { onSuccess: () => setUnpublishTarget(null) },
                  );
                }
              }}
              isLoading={unpublishMutation.isPending}
            >
              Dépublier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
