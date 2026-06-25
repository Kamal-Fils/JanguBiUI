'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
  /**
   * `sidebar` (défaut) : libellé masqué jusqu'au breakpoint `lg` — conçu pour la
   * sidebar desktop rétractable.
   * `row` : libellé toujours visible, pleine largeur, aligné à gauche — conçu
   * pour le tiroir « Plus » mobile et la page Profil.
   */
  variant?: 'sidebar' | 'row';
  /**
   * Surcharge explicite de la classe du libellé. Prioritaire sur `variant`.
   * Sidebar repliée : 'hidden lg:block' (icône seule) — défaut.
   * Profil / mobile : passer 'block' pour un libellé toujours visible.
   */
  labelClassName?: string;
}

/**
 * Bascule clair/sombre partagée (sidebar desktop + tiroir « Plus » mobile +
 * page Profil). La justification est passée via `className` par chaque usage
 * pour éviter tout conflit Tailwind.
 */
export function ThemeToggle({
  className,
  variant = 'sidebar',
  labelClassName,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const isRow = variant === 'row';
  const resolvedLabelClassName =
    labelClassName ?? (isRow ? 'block' : 'hidden lg:block');

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted/70',
        isRow ? 'w-full justify-start' : 'justify-center lg:justify-start',
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
      <span className={resolvedLabelClassName} suppressHydrationWarning>
        {mounted ? (isDark ? 'Mode clair' : 'Mode sombre') : ''}
      </span>
    </button>
  );
}
