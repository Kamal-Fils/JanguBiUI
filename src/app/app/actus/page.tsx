import { AppShell } from '@/components/layouts/app-shell';
import { ArticlesFeed } from '@/features/news/components/articles-feed';

export default function ActusPage() {
  return (
    <AppShell>
      <ArticlesFeed />
    </AppShell>
  );
}
