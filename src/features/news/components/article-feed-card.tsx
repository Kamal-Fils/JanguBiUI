import { Clock, Eye, Newspaper } from 'lucide-react';
import Image from 'next/image';

import { Link } from '@/components/ui/link/link';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import type { Article } from '../types';

import { ArticleTypeBadge } from './article-type-badge';

interface ArticleFeedCardProps {
  article: Article;
  /** À la une : visuel large + titre display serif (une de journal). */
  featured?: boolean;
}

/**
 * Carte « presse » du fil d'actualité (inspiration NYT/BBC) : visuel à ratio
 * stable avec repli brandé AU MÊME ratio (zéro reflow), kicker type + rubrique
 * en micro-capitales, titre serif, chapô et méta discrète. Sans cadre : la
 * hiérarchie vient de l'image et de la typographie, pas de la boîte.
 */
export function ArticleFeedCard({
  article,
  featured = false,
}: ArticleFeedCardProps) {
  return (
    <Link href={`/app/actus/${article.id}`} className="group flex flex-col">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-xl bg-muted',
          featured ? 'aspect-video md:aspect-[2/1]' : 'aspect-[3/2]',
        )}
      >
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            unoptimized
            priority={featured}
            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03] motion-reduce:transform-none"
            sizes={
              featured
                ? '(max-width: 1024px) 100vw, 1024px'
                : '(max-width: 768px) 100vw, 50vw'
            }
          />
        ) : (
          // Repli éditorial brandé, au même ratio que l'image (pas de trou).
          <div
            data-testid="article-card-placeholder"
            aria-hidden="true"
            className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 text-primary/40"
          >
            <Newspaper className={featured ? 'size-12' : 'size-9'} />
          </div>
        )}
      </div>

      <div className={cn('flex min-w-0 flex-col', featured ? 'pt-4' : 'pt-3')}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <ArticleTypeBadge contentType={article.content_type} />
          {article.category && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink">
              {article.category.name}
            </span>
          )}
        </div>

        <h3
          className={cn(
            'font-serif font-bold tracking-tight text-foreground transition-colors group-hover:text-primary',
            featured
              ? 'text-2xl leading-tight md:text-3xl'
              : 'line-clamp-2 text-lg leading-snug',
          )}
        >
          {article.title}
        </h3>

        {article.excerpt && (
          <p
            className={cn(
              'mt-1.5 text-muted-foreground',
              featured
                ? 'line-clamp-3 text-base leading-relaxed'
                : 'line-clamp-2 text-sm',
            )}
          >
            {article.excerpt}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatFrDate(article.published_at, 'short')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {article.views_count}
          </span>
        </div>
      </div>
    </Link>
  );
}
