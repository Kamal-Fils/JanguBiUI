'use client';

import { Eye, Pencil, Send, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';

import { useDeleteArticle } from '../api/delete-article';
import { usePublishArticle } from '../api/publish-article';
import { useUnpublishArticle } from '../api/unpublish-article';
import { Article } from '../types';

import { ArticleTypeBadge } from './article-type-badge';

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  }
> = {
  draft: { label: 'Brouillon', variant: 'outline' },
  published: { label: 'Publié', variant: 'success' },
  unpublished: { label: 'Dépublié', variant: 'destructive' },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

  const publishMutation = usePublishArticle();
  const unpublishMutation = useUnpublishArticle();
  const deleteMutation = useDeleteArticle({
    onSuccess: () => setDeleteTarget(null),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aucun article trouvé.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Titre
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Publié le
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {articles.map((article) => {
              const statusConfig =
                STATUS_CONFIG[article.status] ?? STATUS_CONFIG.draft;
              return (
                <tr key={article.id} className="bg-card hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="line-clamp-1 font-medium text-foreground">
                      {article.title}
                    </span>
                    {article.author_name && (
                      <span className="text-xs text-muted-foreground">
                        par {article.author_name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ArticleTypeBadge contentType={article.content_type} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {article.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(article.published_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={paths.app.article.getHref(article.id)}
                        target="_blank"
                      >
                        <Button variant="ghost" size="icon" title="Voir">
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                      {article.status !== 'unpublished' && (
                        <Link
                          href={paths.app.admin.articleEdit.getHref(article.id)}
                        >
                          <Button variant="ghost" size="icon" title="Modifier">
                            <Pencil className="size-4" />
                          </Button>
                        </Link>
                      )}
                      {article.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Publier"
                          onClick={() => publishMutation.mutate(article.id)}
                          disabled={publishMutation.isPending}
                        >
                          <Send className="size-4" />
                        </Button>
                      )}
                      {article.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Dépublier"
                          onClick={() => setUnpublishTarget(article)}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                      {article.status !== 'published' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(article)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                'Supprimer'
              )}
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
              disabled={unpublishMutation.isPending}
            >
              {unpublishMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                'Dépublier'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
