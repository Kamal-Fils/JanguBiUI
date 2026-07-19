'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { paths } from '@/config/paths';
import { useCreateArticle } from '@/features/news/api/create-article';
import {
  ArticleForm,
  ArticleFormValues,
} from '@/features/news/components/article-form';
import { useUser } from '@/lib/auth';
import { canCreateArticle } from '@/lib/authorization';

export default function NewArticlePage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const createMutation = useCreateArticle({
    onSuccess: () => router.push(paths.app.admin.articles.getHref()),
  });

  useEffect(() => {
    if (!isLoading && !canCreateArticle(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, isLoading, router]);

  useRegisterPageMeta({
    title: 'Nouvel article',
    subtitle: 'Créer un brouillon — vous pourrez le publier ensuite',
  });

  if (isLoading || !canCreateArticle(user)) return null;

  const handleSubmit = (data: ArticleFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex flex-col">
      <ContentContainer>
        {/* Cadre de page standard ; la colonne d'édition reste à 3xl — un
            formulaire d'article ne gagne rien à s'étirer sur 1024 px. */}
        <div className="max-w-3xl">
          {createMutation.error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Une erreur est survenue. Vérifiez les informations et réessayez.
            </div>
          )}
          <ArticleForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Créer le brouillon"
          />
        </div>
      </ContentContainer>
    </div>
  );
}
