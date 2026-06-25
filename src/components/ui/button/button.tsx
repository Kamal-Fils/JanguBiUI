import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { Spinner } from '../spinner';

const buttonVariants = cva(
  // `gap-2` espace icône ↔ libellé (remplace l'ancien mr-2 / <span mx-2>).
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-none active:scale-[0.97] motion-reduce:transform-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gold: 'bg-accent text-accent-foreground shadow hover:bg-accent/85 focus-visible:ring-accent',
        'outline-gold':
          'border border-accent/50 text-gold-ink bg-transparent hover:bg-accent/10',
        'ghost-indigo': 'text-primary hover:bg-primary/10 hover:text-primary',
      },
      size: {
        // default & icon : cible tactile 44px sur mobile, 36px sur desktop (md+).
        default: 'h-11 px-4 py-2 md:h-9',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'size-11 md:size-9',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    icon?: React.ReactNode;
    /** Position de l'icône relative au libellé. Défaut : 'left'. */
    iconPosition?: 'left' | 'right';
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      children,
      isLoading,
      icon,
      iconPosition = 'left',
      disabled,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      // En mode asChild (ex. <Button asChild><Link/></Button>), le Slot doit
      // recevoir un enfant unique : on ne décore pas avec icône/spinner.
      return (
        <Slot
          className={cn(
            buttonVariants({ variant, size, fullWidth, className }),
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="text-current" />}
        {!isLoading && icon && iconPosition === 'left' && icon}
        {children}
        {!isLoading && icon && iconPosition === 'right' && icon}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
