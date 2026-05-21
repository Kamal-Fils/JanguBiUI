'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useArticleDetail } from '@/features/news/api/get-article';
import { useUpdateArticle } from '@/features/news/api/update-article';
import {
  ArticleForm,
  ArticleFormValues,
} from '@/features/news/components/article-form';
import { useUser } from '@/lib/auth';
import { canCreateArticle } from '@/lib/authorization';

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: article, isLoading: articleLoading } = useArticleDetail(
    params.id,
  );

  const updateMutation = useUpdateArticle({
    onSuccess: () => router.push(paths.app.admin.articles.getHref()),
  });

  useEffect(() => {
    if (!userLoading && !canCreateArticle(user)) {
      router.replace('/app');
    }
  }, [user, userLoading, router]);

  if (userLoading || !canCreateArticle(user)) return null;

  if (articleLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (!article) {
    return (
      <AppShell>
        <div className="py-20 text-center text-muted-foreground">
          Article introuvable.
        </div>
      </AppShell>
    );
  }

  const handleSubmit = (data: ArticleFormValues) => {
    updateMutation.mutate({ id: params.id, data });
  };

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader title="Modifier l'article" subtitle={article.title} />
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
          {updateMutation.error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Une erreur est survenue. Vérifiez les informations et réessayez.
            </div>
          )}
          <ArticleForm
            defaultValues={{
              title: article.title,
              excerpt: article.excerpt ?? '',
              content: (article as { content?: string }).content ?? '',
              category_id: article.category?.id,
              content_type: article.content_type,
              scope_type: article.scope_type,
              scope_parish_id: article.scope_parish_id,
              scope_diocese_id: article.scope_diocese_id,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Enregistrer les modifications"
          />
        </div>
      </div>
    </AppShell>
  );
}
