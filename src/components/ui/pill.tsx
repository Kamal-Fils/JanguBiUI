import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

/**
 * Petite pastille de catégorie/portée (scope) — remplace les 4 implémentations
 * inline de `rounded-full px-2 py-0.5 text-[10px]` dans news/agenda/etc.
 */
const pillVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none',
  {
    variants: {
      tone: {
        primary: 'bg-primary/10 text-primary',
        gold: 'bg-accent/15 text-accent',
        muted: 'bg-muted text-muted-foreground',
        outline: 'border border-border text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
);

interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export function Pill({ className, tone, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone }), className)} {...props} />;
}
