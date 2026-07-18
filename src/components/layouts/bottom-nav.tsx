'use client';

import { MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Link } from '@/components/ui/link/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  buildBottomNavItems,
  buildOverflowNavItems,
  isNavActive,
} from '@/config/nav-config';
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

import { SidebarSections } from './sidebar-sections';
import { ThemeToggle } from './theme-toggle';

interface BottomNavProps {
  messageBadge?: number;
}

/**
 * Navigation mobile (<lg) — refonte V4-1 : la bottom-nav garde ses ≤ 4 onglets
 * primaires role-aware ; le bouton « Plus » ouvre désormais un tiroir latéral
 * (Sheet gauche) qui rend les MÊMES sections/sous-navigations que la sidebar
 * desktop (SidebarSections — aucune duplication de nav).
 */
export function BottomNav({ messageBadge }: BottomNavProps) {
  const pathname = usePathname();
  const { data: user } = useUser();
  const navItems = buildBottomNavItems(user);
  const overflow = buildOverflowNavItems(user);
  const [moreOpen, setMoreOpen] = useState(false);
  const overflowActive = overflow.some((i) => isNavActive(pathname, i.href));

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
    >
      {/* Filet or — liseré éditorial en haut de la barre */}
      <div
        aria-hidden="true"
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(to right, transparent, hsl(var(--hairline-gold) / 0.55), transparent)',
        }}
      />
      <div className="mx-auto flex h-[72px] max-w-lg items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;
          const badge =
            item.label === 'Messages' && messageBadge && messageBadge > 0
              ? messageBadge
              : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 min-w-0 flex-col items-center justify-center px-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Pilule active enveloppant icône + label */}
              <span
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200',
                  isActive ? 'bg-primary/12' : 'bg-transparent',
                )}
              >
                <span className="relative flex items-center justify-center">
                  <Icon className="size-5" />
                  {badge !== undefined && (
                    <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'max-w-full truncate text-[11px] leading-none transition-all',
                    isActive ? 'font-semibold text-primary' : 'font-medium',
                  )}
                >
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}

        {/* « Plus » — tiroir latéral avec les sections/sous-navs de la sidebar */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Menu"
            className={cn(
              'relative flex flex-1 min-w-0 flex-col items-center justify-center px-1 transition-colors',
              overflowActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200',
                overflowActive ? 'bg-primary/12' : 'bg-transparent',
              )}
            >
              <MoreHorizontal className="size-5" />
              <span
                className={cn(
                  'max-w-full truncate text-[11px] leading-none',
                  overflowActive ? 'font-semibold text-primary' : 'font-medium',
                )}
              >
                Plus
              </span>
            </span>
          </button>
          <SheetContent
            side="left"
            className="w-[300px] max-w-[85vw] overflow-y-auto p-4"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="font-serif text-xl">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Toutes les sections et sous-sections de l’application.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-5">
              {/* Apparence — bascule clair/sombre, en tête du tiroir */}
              <section>
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Apparence
                </h3>
                <ThemeToggle
                  variant="row"
                  className="border border-border hover:bg-muted"
                />
              </section>

              <nav aria-label="Navigation principale">
                <SidebarSections onNavigate={() => setMoreOpen(false)} />
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
