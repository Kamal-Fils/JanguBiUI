'use client';

import { ArrowRight, Newspaper } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { useParishArticles } from '@/features/news/api/get-articles';
import { ArticleCard } from '@/features/news/components/article-card';

export function ParishNewsSection() {
  const { data, isLoading } = useParishArticles({ limit: 3 });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
          <Newspaper className="size-3.5" />
          Ma paroisse
        </h2>
        <Link
          href="/app/actus"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Tout voir
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!data?.results.length) && (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Aucune actualité pour votre paroisse pour l&apos;instant.
        </p>
      )}

      {!isLoading && data?.results.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </section>
  );
}
