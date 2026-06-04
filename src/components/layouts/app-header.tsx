'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb/breadcrumb';
import { buildBreadcrumbs } from '@/config/breadcrumbs';

import { NotificationBell } from './notification-bell';
import { usePageMetaValue } from './page-meta';

/**
 * En-tête de shell partagé (sous-étape 1C) : fil d'Ariane sur desktop, app-bar
 * (retour + titre + cloche) sur mobile.
 *
 * Ne s'affiche QUE pour les routes « migrées » qui enregistrent leur meta via
 * `useRegisterPageMeta`. Les pages non migrées conservent leur `<PageHeader>` et
 * la cloche flottante (gérée par `AppShell`) — migration progressive (lot 1C-b).
 */
export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const meta = usePageMetaValue();

  if (!meta) return null;

  const trail = buildBreadcrumbs(pathname, meta.leafLabel ?? meta.title);
  const isDeep = trail.length > 1;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-surface/90 backdrop-blur-md">
      {/* Desktop — fil d'Ariane (les actions restent dans la sidebar en 1C-a). */}
      <div className="hidden items-center gap-3 px-4 py-3 md:flex">
        <Breadcrumb items={trail} className="flex-1" />
      </div>

      {/* Mobile — app-bar : retour (routes profondes) + titre + cloche. */}
      <div className="flex items-center gap-2 px-3 py-2.5 md:hidden">
        {isDeep && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <span className="min-w-0 flex-1 truncate font-serif text-base font-bold tracking-tight text-foreground">
          {meta.title}
        </span>
        <NotificationBell className="size-9 shrink-0 justify-center rounded-full p-0" />
      </div>
    </header>
  );
}
