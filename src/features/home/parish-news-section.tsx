'use client';

import { Newspaper } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useParishArticles } from '@/features/news/api/get-articles';
import { ArticleCard } from '@/features/news/components/article-card';

export function ParishNewsSection() {
  const { data, isLoading, isError, refetch } = useParishArticles({ limit: 3 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Sans cet état, une panne réseau se lisait « aucune actualité » : le fidèle
  // croyait sa paroisse muette au lieu de pouvoir réessayer.
  if (isError) {
    return (
      <ErrorState
        title="Actualités indisponibles"
        description="Les actualités de votre paroisse n’ont pas pu être chargées."
        onRetry={() => void refetch()}
        className="py-8"
      />
    );
  }

  if (!data?.results.length) {
    return (
      <EmptyState
        icon={<Newspaper />}
        title="Rien de neuf pour l’instant"
        description="Les annonces de votre paroisse s’afficheront ici."
        className="py-8"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.results.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
