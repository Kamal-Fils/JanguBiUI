import { Clock, Eye, Newspaper } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { CardEyebrow } from '@/components/ui/card/card';
import { cn } from '@/lib/utils';

import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const scopeLabel: Record<string, string> = {
  global: 'Universel',
  diocese: 'Diocèse',
  parish: 'Paroisse',
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/app/actus/${article.id}`}
      className={cn(
        'group flex gap-3.5 rounded-xl border border-border/50 bg-transparent p-3 transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-normal)] ease-out-soft',
        'hover:border-accent/30 hover:bg-muted/50 hover:shadow-soft-sm active:scale-[0.98] motion-reduce:transform-none',
      )}
    >
      {article.cover_image_url ? (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04] motion-reduce:transform-none"
            sizes="80px"
          />
        </div>
      ) : (
        // Repli éditorial : bloc dégradé indigo → or quand l'article n'a pas d'image.
        <div
          className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 text-primary/40"
          aria-hidden="true"
        >
          <Newspaper className="size-7" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          {article.category && (
            <CardEyebrow className="text-gold-ink">
              {article.category.name}
            </CardEyebrow>
          )}
          {article.category && (
            <span
              className="size-1 shrink-0 rounded-full bg-accent/50"
              aria-hidden="true"
            />
          )}
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {scopeLabel[article.scope_type] ?? article.scope_type}
          </span>
        </div>
        <p className="line-clamp-2 font-serif text-[0.95rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </p>
        {article.excerpt && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {article.excerpt}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDate(article.published_at)}
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
