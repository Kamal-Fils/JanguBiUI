'use client';

import { useNotificationsSocket } from '@/hooks/use-notifications-socket';
import { useMessagingStore } from '@/stores/messaging-store';

import { AppFooter } from './app-footer';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { AppTopBar } from './app-top-bar';
import { BottomNav } from './bottom-nav';
import { NotificationBell } from './notification-bell';
import { OnboardingGuard } from './onboarding-guard';
import { PageMetaProvider, usePageMetaValue } from './page-meta';

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
 * Shell de l'app — refonte V4-1 « layout classique » : header sticky en haut
 * (marque + actions, sans nav horizontale), puis sur desktop (`lg+`) une barre
 * latérale (AppSidebar — navigations + sous-navigations, rétractable) à gauche
 * d'une colonne contenu (AppHeader contextuel + main + AppFooter). Mobile
 * (<lg) : BottomNav + tiroir « Plus » (mêmes sections que la sidebar).
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
        <AppTopBar />
      </div>
      <div className="flex flex-1">
        <AppSidebar />
        {/* Colonne contenu — le dégagement bas (<lg) évite la bottom-nav fixe. */}
        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          <div className="sticky top-0 z-30 md:top-16">
            <AppHeader />
          </div>
          <main className="flex-1">{children}</main>
          <AppFooter />
        </div>
      </div>
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
