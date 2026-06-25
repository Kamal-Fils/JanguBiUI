'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/utils/cn';

interface BackButtonProps {
  /** Destination explicite. Si absent, revient à la page précédente. */
  href?: string;
  /** Libellé du bouton. */
  label?: string;
  className?: string;
}

/**
 * Bouton de retour unifié : flèche + libellé. Navigue vers `href` si fourni,
 * sinon retourne à la page précédente de l'historique.
 */
export function BackButton({
  href,
  label = 'Retour',
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
