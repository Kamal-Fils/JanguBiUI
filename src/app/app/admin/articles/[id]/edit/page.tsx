'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useAdminArticleDetail } from '@/features/news/api/get-admin-article';
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
  const { data: article, isLoading: articleLoading } = useAdminArticleDetail(
    params.id,
  );

  const updateMutation = useUpdateArticle({
    onSuccess: () => router.push(paths.app.admin.articles.getHref()),
  });

  useEffect(() => {
    if (!userLoading && !canCreateArticle(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, router]);

  useRegisterPageMeta({
    title: "Modifier l'article",
    subtitle: article?.title ?? 'Chargement…',
  });

  if (userLoading || !canCreateArticle(user)) return null;

  const handleSubmit = (data: ArticleFormValues) => {
    updateMutation.mutate({ id: params.id, data });
  };

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
        {updateMutation.error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Une erreur est survenue. Vérifiez les informations et réessayez.
          </div>
        )}

        {articleLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !article ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Article introuvable.
          </div>
        ) : article.scope_type === 'church' ? (
          // Le formulaire admin gère global/diocèse/paroisse. La portée « église »
          // (Chantier 3a) n'est pas éditable ici — on l'exclut explicitement
          // (narrow le type scope_type pour ArticleForm, et évite toute corruption).
          <div className="py-20 text-center text-sm text-muted-foreground">
            Les articles de portée « église » ne sont pas éditables depuis cette
            interface.
          </div>
        ) : (
          <ArticleForm
            defaultValues={{
              title: article.title,
              excerpt: article.excerpt ?? '',
              content: article.content,
              category_id: article.category?.id,
              content_type: article.content_type ?? 'article',
              scope_type: article.scope_type,
              scope_parish_id: article.scope_parish_id ?? undefined,
              scope_diocese_id: article.scope_diocese_id ?? undefined,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Enregistrer les modifications"
          />
        )}
      </div>
    </div>
  );
}
