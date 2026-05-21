import { Clock, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
      className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted active:scale-[0.98]"
    >
      {article.cover_image_url && (
        <div className="relative size-20 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          {article.category && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                'bg-primary/10 text-primary',
              )}
            >
              {article.category.name}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {scopeLabel[article.scope_type] ?? article.scope_type}
          </span>
        </div>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
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
