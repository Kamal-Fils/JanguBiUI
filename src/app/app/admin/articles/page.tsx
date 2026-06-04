'use client';

import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button/button';
import { paths } from '@/config/paths';
import { useAdminArticles } from '@/features/news/api/get-admin-articles';
import { AdminArticleList } from '@/features/news/components/admin-article-list';
import { ArticleStatus } from '@/features/news/types';
import { useUser } from '@/lib/auth';
import { canCreateArticle } from '@/lib/authorization';

const STATUS_FILTERS: { label: string; value: ArticleStatus | '' }[] = [
  { label: 'Tous', value: '' },
  { label: 'Brouillons', value: 'draft' },
  { label: 'Publiés', value: 'published' },
  { label: 'Dépubliés', value: 'unpublished' },
];

export default function AdminArticlesPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');

  useEffect(() => {
    if (!isLoading && !canCreateArticle(user)) {
      router.replace('/app');
    }
  }, [user, isLoading, router]);

  const { data, isLoading: articlesLoading } = useAdminArticles(
    statusFilter ? { status: statusFilter } : undefined,
  );

  if (isLoading || !canCreateArticle(user)) return null;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Gestion des articles"
        subtitle="Créer, modifier et publier des articles"
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Link href={paths.app.admin.articleNew.getHref()}>
            <Button size="sm">
              <PlusCircle className="mr-2 size-4" />
              Nouvel article
            </Button>
          </Link>
        </div>

        <AdminArticleList
          articles={data?.results ?? []}
          isLoading={articlesLoading}
        />
      </div>
    </div>
  );
}
