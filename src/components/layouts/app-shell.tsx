'use client';

import { useNotificationsSocket } from '@/hooks/use-notifications-socket';
import { useMessagingStore } from '@/stores/messaging-store';

import { AppHeader } from './app-header';
import { AppTopBar } from './app-top-bar';
import { BottomNav } from './bottom-nav';
import { NotificationBell } from './notification-bell';
import { OnboardingGuard } from './onboarding-guard';
import { PageMetaProvider, usePageMetaValue } from './page-meta';
import { SpiritualiteSubNav } from './spiritualite-subnav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <OnboardingGuard>
      <PageMetaProvider>
        <AppShellLayout>{children}</AppShellLayout>
      </PageMetaProvider>
    </OnboardingGuard>
  );
}

/**
 * Shell de l'app — refonte V3 « header » : la navigation desktop vit dans une
 * barre supérieure persistante (AppTopBar) au lieu d'une sidebar. Le bloc
 * sticky empile : barre de marque/nav (md+) → rangée contextuelle titre/retour/
 * fil d'Ariane (AppHeader, pages avec meta) → sous-nav Spiritualité (section
 * spirituelle). Mobile : BottomNav + tiroir « Plus » restent la nav principale.
 */
function AppShellLayout({ children }: AppShellProps) {
  const totalUnread = useMessagingStore((s) => s.totalUnread);
  const meta = usePageMetaValue();

  // Socket temps réel global (/ws/notifications/) : rend visibles immédiatement
  // les conversations/messages entrants au lieu d'attendre le poll de 30 s.
  useNotificationsSocket();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="sticky top-0 z-40">
        <AppTopBar messageBadge={totalUnread} />
        <AppHeader />
        <SpiritualiteSubNav />
      </div>
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav messageBadge={totalUnread} />
      {/* Cloche flottante mobile — uniquement pour les pages plein écran sans
          meta (chat, assistant…) : les autres l'affichent dans l'app-bar. */}
      {!meta && (
        <div className="fixed right-3 top-3 z-50 md:hidden">
          <NotificationBell className="size-10 rounded-full border border-border bg-background/90 shadow-sm backdrop-blur-sm p-0 justify-center" />
        </div>
      )}
    </div>
  );
}
