import { AppShell } from '@/components/layouts/app-shell';
import { ArticleDetail } from '@/features/news/components/article-detail';

interface ArticlePageProps {
  params: { id: string };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  return (
    <AppShell hideNav>
      <ArticleDetail articleId={params.id} />
    </AppShell>
  );
}
