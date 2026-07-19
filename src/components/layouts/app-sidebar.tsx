'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { SidebarSections } from './sidebar-sections';

/** Clé localStorage de l'état replié (persisté entre sessions). */
export const SIDEBAR_COLLAPSED_KEY = 'jangubi.sidebar.collapsed';

/**
 * Barre latérale desktop (`lg+`) — refonte V4-1 « layout classique » : porte
 * les navigations ET les sous-navigations (sections dépliables), sticky sous
 * le header, scrollable, rétractable en mode icônes (état persisté).
 * Mobile (<lg) : la BottomNav + le tiroir Sheet portent la même navigation.
 */
export function AppSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);

  // Hydratation sûre : l'état persisté n'est lu qu'au montage (client).
  React.useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
  }, []);

  const persistCollapsed = (value: boolean) => {
    setCollapsed(value);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  };

  return (
    <aside
      className={cn(
        'sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 flex-col border-r border-border bg-background lg:flex',
        collapsed ? 'w-[72px]' : 'w-[264px]',
      )}
    >
      {/* En tête de barre : la commande de repli est là où l'œil arrive, et
          reste atteignable sans faire défiler une navigation longue. */}
      <div
        className={cn(
          'flex items-center px-2 pt-3',
          collapsed ? 'justify-center' : 'justify-end',
        )}
      >
        <button
          type="button"
          onClick={() => persistCollapsed(!collapsed)}
          aria-label={
            collapsed ? 'Déplier la navigation' : 'Replier la navigation'
          }
          title={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <nav
        aria-label="Navigation principale"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2"
      >
        <SidebarSections
          collapsed={collapsed}
          onExpandRequest={() => persistCollapsed(false)}
        />
      </nav>
    </aside>
  );
}
