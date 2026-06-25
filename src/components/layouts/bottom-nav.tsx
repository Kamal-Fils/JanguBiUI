'use client';

import { MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer/drawer';
import { Link } from '@/components/ui/link/link';
import {
  buildBottomNavItems,
  buildOverflowNavItems,
  isNavActive,
  type NavItem,
} from '@/config/nav-config';
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

import { ThemeToggle } from './theme-toggle';

interface BottomNavProps {
  messageBadge?: number;
}

/** Section éditoriale d'un item du tiroir « Plus ». */
type OverflowSection = 'Prière' | 'Communauté' | 'Mon compte';

const ORDERED_SECTIONS: OverflowSection[] = [
  'Prière',
  'Communauté',
  'Mon compte',
];

/** Classe un item d'overflow dans une section par son href. */
function sectionForHref(href: string): OverflowSection {
  if (href === '/app/profil') return 'Mon compte';
  if (
    href.startsWith('/app/spirituel') ||
    href.startsWith('/app/bible') ||
    href.startsWith('/app/chapelet') ||
    href.startsWith('/app/intentions')
  ) {
    return 'Prière';
  }
  // Documents, Dons, Agenda, Transfert, Messages, Clergé…
  return 'Communauté';
}

/** Regroupe les items d'overflow par section, dans l'ordre éditorial. */
function groupOverflow(
  items: NavItem[],
): { section: OverflowSection; items: NavItem[] }[] {
  return ORDERED_SECTIONS.map((section) => ({
    section,
    items: items.filter((i) => sectionForHref(i.href) === section),
  })).filter((g) => g.items.length > 0);
}

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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
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

        {/* « Plus » — items sidebar non présents dans la bottom-nav */}
        {overflow.length > 0 && (
          <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
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
                    overflowActive
                      ? 'font-semibold text-primary'
                      : 'font-medium',
                  )}
                >
                  Plus
                </span>
              </span>
            </button>
            <DrawerContent
              side="bottom"
              className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <DrawerHeader className="px-0 text-left">
                <DrawerTitle className="font-serif text-xl">Plus</DrawerTitle>
              </DrawerHeader>
              <div className="space-y-5">
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

                {groupOverflow(overflow).map((group) => (
                  <section key={group.section}>
                    <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.section}
                    </h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isNavActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                              active
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted',
                            )}
                            aria-current={active ? 'page' : undefined}
                          >
                            <Icon className="size-6" />
                            <span className="text-xs font-medium text-foreground">
                              {item.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
