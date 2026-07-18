'use client';

import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft, BookOpen, Clock, Eye, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { useArticleDetail } from '../api/get-article';

import { ArticleHero } from './article-hero';
import { ArticleTypeBadge } from './article-type-badge';

interface ArticleDetailProps {
  articleId: string;
}

const scopeLabel: Record<string, string> = {
  global: 'Universel',
  diocese: 'Diocèse',
  parish: 'Paroisse',
  church: 'Église',
};

const WORDS_PER_MINUTE = 200;

/** Temps de lecture estimé (~200 mots/min), calculé sur le texte sans balises. */
function estimateReadingMinutes(content: string): number {
  const words = content
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function ArticleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl p-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
      <Skeleton className="mb-6 aspect-video w-full rounded-xl" />
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-9 w-full" />
      <Skeleton className="mb-3 h-9 w-3/4" />
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

  const readingMinutes = estimateReadingMinutes(article.content);
  // La lettrine est réservée aux formats longs (article, lettre pastorale) :
  // sur une annonce de 2 lignes elle serait disproportionnée.
  const withLettrine = article.content_type !== 'announcement';

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
        {/* Bannière au-dessus du titre — pleine largeur mobile, arrondie md+. */}
        <div className="md:px-6 md:pt-6 lg:px-8">
          <ArticleHero imageUrl={article.cover_image_url} alt={article.title} />
        </div>

        {/* En-tête éditorial : kicker → titre display serif → chapô → méta. */}
        <header className="px-4 pt-6 md:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ArticleTypeBadge contentType={article.content_type} />
            {article.category && (
              <>
                <span
                  className="size-1 rounded-full bg-accent/50"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
                  {article.category.name}
                </span>
              </>
            )}
            <span
              className="size-1 rounded-full bg-accent/50"
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {scopeLabel[article.scope_type] ?? article.scope_type}
            </span>
          </div>

          <h1 className="max-w-reading font-serif text-headline font-bold tracking-tight text-foreground md:text-display">
            {article.title}
          </h1>

          {article.excerpt && (
            // Chapô — corps supérieur gris doux, mesure de lecture.
            <p className="mt-3 max-w-reading text-lg leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          )}

          <div className="hairline-gold mb-4 mt-5" aria-hidden="true" />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              <User className="size-3.5" />
              {article.author_name}
            </span>
            {article.published_at && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {formatFrDate(article.published_at, 'long')}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {readingMinutes} min de lecture
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              {article.views_count} vue{article.views_count !== 1 ? 's' : ''}
            </span>
          </div>
        </header>

        <div className="px-4 pb-12 pt-6 md:px-6 lg:px-8">
          {article.content_format === 'html' ? (
            <div
              className={cn(
                'prose prose-slate max-w-reading text-foreground dark:prose-invert md:prose-lg',
                'prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-foreground',
                'prose-p:leading-[1.8] prose-p:text-foreground/90',
                'prose-a:text-primary prose-a:underline-offset-2',
                'prose-blockquote:border-l-accent/60 prose-blockquote:font-serif prose-blockquote:text-foreground/80',
                'prose-strong:text-foreground prose-li:text-foreground/90',
                'prose-img:rounded-xl prose-hr:border-border',
                withLettrine && 'lettrine',
              )}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.content),
              }}
            />
          ) : (
            // Ancien contenu « texte brut » (rédigé en textarea) : préserver les
            // sauts de ligne au lieu de l'écraser en un seul bloc HTML.
            <div
              className={cn(
                'max-w-reading whitespace-pre-line text-base leading-[1.8] text-foreground/90',
                withLettrine && 'lettrine-plain',
              )}
            >
              {article.content}
            </div>
          )}

          {/* Fin d'article — séparateur éditorial, marque de clôture. */}
          <div
            className="mt-10 flex max-w-reading items-center gap-3"
            aria-hidden="true"
          >
            <span className="hairline-gold flex-1" />
            <span className="font-serif text-sm leading-none text-gold-ink">
              ✦
            </span>
            <span className="hairline-gold flex-1" />
          </div>
        </div>
      </div>
    </article>
  );
}
