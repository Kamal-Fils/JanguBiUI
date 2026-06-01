'use client';

import { usePathname } from 'next/navigation';

import { Link } from '@/components/ui/link/link';
import { buildBottomNavItems } from '@/config/nav-config';
import { useUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  messageBadge?: number;
}

export function BottomNav({ messageBadge }: BottomNavProps) {
  const pathname = usePathname();
  const { data: user } = useUser();
  const navItems = buildBottomNavItems(user);

  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex h-[60px] max-w-lg items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/app' || item.href === '/app/admin'
              ? pathname === item.href
              : pathname.startsWith(item.href);
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
                'relative flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={cn(
                  'relative flex size-10 items-center justify-center rounded-full transition-all duration-200',
                  isActive ? 'bg-primary/12 scale-105' : 'bg-transparent',
                )}
              >
                <Icon className="size-5" />
                {badge !== undefined && (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'text-[10px] transition-all',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
