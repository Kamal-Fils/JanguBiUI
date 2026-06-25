import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const cardVariants = cva(
  'rounded-xl border text-foreground transition-[box-shadow,transform,border-color] duration-[var(--duration-normal)] ease-out-soft',
  {
    variants: {
      variant: {
        // Défaut historique : surface papier + ombre douce légère.
        default: 'border-border bg-background-surface shadow-soft-sm',
        // Carte mise en avant.
        elevated: 'border-border/60 bg-card shadow-soft',
        // Carte cliquable : se soulève au survol (désactivé en reduced-motion).
        interactive:
          'border-border bg-card shadow-soft-sm hover:-translate-y-0.5 hover:shadow-soft hover:border-border focus-within:shadow-soft motion-reduce:hover:translate-y-0',
        // Sans relief.
        flat: 'border-border bg-background-surface',
        // Carte éditoriale : filet or dégradé en tête de carte.
        feature:
          'border-border/60 bg-card shadow-soft overflow-hidden before:block before:h-[3px] before:w-full before:bg-gradient-to-r before:from-gold before:via-gold/70 before:to-transparent',
        // Carte « sacrée » : surface secondaire teintée indigo.
        sacred: 'border-primary/15 bg-secondary/60 shadow-soft-sm',
        // Carte fantôme : transparente, se révèle au survol.
        ghost: 'border-border/50 bg-transparent hover:bg-muted/50 shadow-none',
        // Citation mise en exergue : dégradé indigo → or, coins très arrondis.
        pullquote:
          'border-0 bg-gradient-to-br from-primary/8 via-primary/5 to-accent/5 rounded-3xl',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Surtitre éditorial : petite étiquette majuscule au-dessus du titre.
const CardEyebrow = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
      className,
    )}
    {...props}
  />
));
CardEyebrow.displayName = 'CardEyebrow';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/heading-has-content
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardEyebrow,
  CardDescription,
  CardContent,
};
