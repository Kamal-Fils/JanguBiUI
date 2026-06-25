'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useParishArticles } from '@/features/news/api/get-articles';
import { ArticleCard } from '@/features/news/components/article-card';

export function ParishNewsSection() {
  const { data, isLoading } = useParishArticles({ limit: 3 });

  return (
    <div className="flex flex-col gap-3">
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
    </div>
  );
}
