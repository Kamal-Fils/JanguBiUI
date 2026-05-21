'use client';

import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft, Clock, Eye, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';

import { useArticleDetail } from '../api/get-article';

interface ArticleDetailProps {
  articleId: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const scopeLabel: Record<string, string> = {
  global: 'Universel',
  diocese: 'Diocèse',
  parish: 'Paroisse',
};

function ArticleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
      <Skeleton className="mb-4 h-48 w-full rounded-xl" />
      <Skeleton className="mb-2 h-4 w-1/3" />
      <Skeleton className="mb-3 h-7 w-full" />
      <Skeleton className="mb-6 h-4 w-2/3" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${80 + (i % 3) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ArticleDetail({ articleId }: ArticleDetailProps) {
  const router = useRouter();
  const { data: article, isLoading, isError } = useArticleDetail(articleId);

  if (isLoading) return <ArticleDetailSkeleton />;

  if (isError || !article) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Article introuvable.</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-primary underline underline-offset-2"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <article className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="truncate text-sm font-semibold text-foreground">
          {article.title}
        </span>
      </div>

      <div className="mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-5xl">
        {article.cover_image_url && (
          <div className="relative h-52 w-full overflow-hidden">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </div>
        )}

        <div className="px-4 py-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {article.category && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {article.category.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {scopeLabel[article.scope_type] ?? article.scope_type}
            </span>
          </div>

          <h1 className="mb-3 text-xl font-bold leading-snug text-foreground">
            {article.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3.5" />
              {article.author_name}
            </span>
            {article.published_at && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDate(article.published_at)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {article.views_count} vue{article.views_count !== 1 ? 's' : ''}
            </span>
          </div>

          <div
            className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.content),
            }}
          />
        </div>
      </div>
    </article>
  );
}
