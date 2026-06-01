import { AppShell } from '@/components/layouts/app-shell';
import { HomeRouter } from '@/features/home/home-router';

export default function HomePage() {
  return (
    <AppShell>
      <HomeRouter />
    </AppShell>
  );
}
