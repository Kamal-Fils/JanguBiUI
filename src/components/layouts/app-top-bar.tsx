'use client';

import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown/dropdown';
import { Link } from '@/components/ui/link/link';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  buildBottomNavItems,
  buildNavItems,
  isNavActive,
  NavItem,
} from '@/config/nav-config';
import { useLogout, useUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="10" y="2" width="4" height="20" rx="2" />
      <rect x="2" y="8" width="20" height="4" rx="2" />
    </svg>
  );
}

interface TopNavLinkProps {
  item: NavItem;
  active: boolean;
  badge?: number;
}

function TopNavLink({ item, active, badge }: TopNavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/12 text-primary shadow-soft-sm'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {badge !== undefined && (
          <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="hidden lg:inline">{item.label}</span>
    </Link>
  );
}

interface AppTopBarProps {
  messageBadge?: number;
}

/**
 * Barre de navigation principale — desktop/tablette (`md+`). Remplace
 * l'ancienne sidebar : marque à gauche, navigation horizontale role-aware au
 * centre (+ menu « Plus » pour le reste), cloche/thème/compte à droite.
 * Sur mobile la navigation reste portée par la BottomNav + tiroir « Plus ».
 */
export function AppTopBar({ messageBadge }: AppTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout({
    onSuccess: () => router.replace('/auth/login'),
  });

  // Profil vit dans le menu avatar — pas dans la nav principale.
  const allItems = buildNavItems(user).filter((i) => i.href !== '/app/profil');
  // Items inline = les primaires role-aware de la bottom-nav + Messages
  // (badge non-lus toujours visible) ; le reste bascule dans « Plus ».
  const inlineHrefs = new Set(buildBottomNavItems(user).map((i) => i.href));
  inlineHrefs.add('/app/messages');
  const inlineItems = allItems.filter((i) => inlineHrefs.has(i.href));
  const overflowItems = allItems.filter((i) => !inlineHrefs.has(i.href));
  const overflowActive = overflowItems.some((i) =>
    isNavActive(pathname, i.href),
  );

  const fullName = [user?.profile?.first_name, user?.profile?.last_name]
    .filter(Boolean)
    .join(' ');
  const homeHref = inlineItems[0]?.href ?? '/app';

  return (
    <div className="hidden border-b border-border bg-background/95 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:gap-6 lg:px-6">
        {/* Marque */}
        <Link
          href={homeHref}
          aria-label="Jàngu Bi — accueil"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <CrossIcon className="size-5 text-primary" />
          </span>
          <span className="font-serif text-lg font-bold tracking-tight text-foreground">
            Jàngu Bi
          </span>
        </Link>

        {/* Navigation principale */}
        <nav
          aria-label="Navigation principale"
          className="flex min-w-0 flex-1 items-center gap-1"
        >
          {inlineItems.map((item) => (
            <TopNavLink
              key={item.href}
              item={item}
              active={isNavActive(pathname, item.href)}
              badge={
                item.href === '/app/messages' && messageBadge
                  ? messageBadge
                  : undefined
              }
            />
          ))}
          {overflowItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                    overflowActive
                      ? 'bg-primary/12 text-primary shadow-soft-sm'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  Plus
                  <ChevronDown className="size-4" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {overflowItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="flex w-full cursor-pointer items-center gap-2.5"
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Actions globales */}
        <div className="flex shrink-0 items-center gap-1">
          <NotificationBell className="size-10 justify-center rounded-full p-0" />
          <ThemeToggle
            className="size-10 justify-center rounded-full p-0"
            labelClassName="hidden"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menu du compte"
                className="flex items-center gap-1.5 rounded-full p-1 pr-2 transition-colors hover:bg-muted/70"
              >
                <UserAvatar
                  size="sm"
                  name={fullName || undefined}
                  email={user?.email}
                  src={user?.profile?.avatar}
                />
                <ChevronDown
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {fullName || user?.email}
                </span>
                {fullName && (
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/app/profil"
                  className="flex w-full cursor-pointer items-center gap-2.5"
                >
                  <UserIcon className="size-4 text-muted-foreground" />
                  Mon profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => logout()}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2.5 size-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
