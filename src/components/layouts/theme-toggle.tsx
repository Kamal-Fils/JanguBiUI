'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  /**
   * Classe du libellé. Sidebar repliée : 'hidden lg:block' (icône seule) — défaut.
   * Profil / mobile : passer 'block' pour un libellé toujours visible.
   */
  labelClassName?: string;
}

/**
 * Bascule clair/sombre partagée (sidebar desktop + page Profil mobile). La
 * justification (centrée repliée vs alignée) est passée via `className` par
 * chaque usage pour éviter tout conflit Tailwind.
 */
export function ThemeToggle({
  className,
  labelClassName = 'hidden lg:block',
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted/70',
        className,
      )}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-5 shrink-0 text-warning" />
        ) : (
          <Moon className="size-5 shrink-0 text-info" />
        )
      ) : (
        <span className="size-5 shrink-0" aria-hidden="true" />
      )}
      <span className={labelClassName} suppressHydrationWarning>
        {mounted ? (isDark ? 'Mode clair' : 'Mode sombre') : ''}
      </span>
    </button>
  );
}
