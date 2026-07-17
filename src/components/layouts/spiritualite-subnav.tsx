'use client';

import { usePathname } from 'next/navigation';

import { Link } from '@/components/ui/link/link';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';
import { cn } from '@/lib/utils';

interface SpiritualLink {
  label: string;
  href: string;
  clergyOnly?: boolean;
}

const SPIRITUAL_LINKS: SpiritualLink[] = [
  { label: 'Bible', href: '/app/bible' },
  { label: 'Liturgie du jour', href: '/app/spirituel/liturgie' },
  {
    label: 'Liturgie des heures',
    href: '/app/spirituel/heures',
    clergyOnly: true,
  },
  { label: 'Chapelet', href: '/app/chapelet' },
  { label: 'TV catholique', href: '/app/tv' },
];

const SPIRITUAL_ROOTS = [
  '/app/spirituel',
  '/app/bible',
  '/app/chapelet',
  '/app/tv',
];

export function isSpiritualPath(pathname: string): boolean {
  return SPIRITUAL_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

/**
 * Sous-navigation persistante de la section Spiritualité (retours testeurs
 * n°2 et n°10) : où que l'on soit dans la section (Bible, Chapelet, Liturgie,
 * TV), les destinations spirituelles restent visibles et accessibles en un
 * tap — au lieu d'onglets mélangés découverts au hasard dans une page.
 */
export function SpiritualiteSubNav() {
  const pathname = usePathname();
  const { data: user } = useUser();

  if (!isSpiritualPath(pathname)) return null;

  const links = SPIRITUAL_LINKS.filter((l) => !l.clergyOnly || isClergy(user));

  return (
    <nav
      aria-label="Sections spirituelles"
      className="border-b border-border/60 bg-background/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-3 py-2 md:px-4 lg:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-soft-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
