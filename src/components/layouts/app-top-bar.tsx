'use client';

import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import { buildBottomNavItems } from '@/config/nav-config';
import { useLogout, useUser } from '@/lib/auth';

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

/**
 * Barre supérieure — desktop/tablette (`md+`). Refonte V4-1 « layout
 * classique » : la navigation horizontale a été retirée (elle vit dans la
 * barre latérale AppSidebar sur `lg+`, et dans la BottomNav + tiroir sur
 * mobile). Le header conserve la marque à gauche et cloche/thème/compte à
 * droite.
 */
export function AppTopBar() {
  const router = useRouter();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout({
    onSuccess: () => router.replace('/auth/login'),
  });

  const fullName = [user?.profile?.first_name, user?.profile?.last_name]
    .filter(Boolean)
    .join(' ');
  // Même home role-aware que la nav (admin pur → /app/admin).
  const homeHref = buildBottomNavItems(user)[0]?.href ?? '/app';

  return (
    <div className="hidden border-b border-border bg-background/95 backdrop-blur-md md:block">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
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
