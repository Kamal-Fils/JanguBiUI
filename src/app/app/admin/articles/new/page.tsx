'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
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
    </div>
  );
}
