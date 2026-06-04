import { use } from 'react';

import { ArticleDetail } from '@/features/news/components/article-detail';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const { id } = use(params);
  return <ArticleDetail articleId={id} />;
}
