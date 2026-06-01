import { use } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { ArticleDetail } from '@/features/news/components/article-detail';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const { id } = use(params);
  return (
    <AppShell hideNav>
      <ArticleDetail articleId={id} />
    </AppShell>
  );
}
