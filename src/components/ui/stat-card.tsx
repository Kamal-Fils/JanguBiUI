import * as React from 'react';

import { Link } from '@/components/ui/link/link';
import { cn } from '@/utils/cn';

type StatTone = 'primary' | 'gold' | 'success' | 'info' | 'warning' | 'muted';

const toneClass: Record<StatTone, string> = {
  primary: 'bg-primary/10 text-primary',
  gold: 'bg-accent/15 text-accent',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  muted: 'bg-muted text-muted-foreground',
};

interface StatCardProps {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label: string;
  href?: string;
  tone?: StatTone;
  className?: string;
}

/**
 * Tuile de statistique unifiée (remplace 6 copies dans les dashboards).
 * Cliquable si `href` fourni.
 */
export function StatCard({
  icon,
  value,
  label,
  href,
  tone = 'primary',
  className,
}: StatCardProps) {
  const inner = (
    <>
      {icon && (
        <span
          className={cn(
            'mb-3 flex size-10 items-center justify-center rounded-lg [&_svg]:size-5',
            toneClass[tone],
          )}
        >
          {icon}
        </span>
      )}
      <span className="font-serif text-2xl font-bold tabular-nums text-foreground">
        {value}
      </span>
      <span className="mt-0.5 text-xs text-muted-foreground">{label}</span>
    </>
  );

  const base =
    'flex flex-col rounded-xl border border-border bg-card p-4 shadow-soft-sm';

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          'transition-all hover:-translate-y-0.5 hover:shadow-soft motion-reduce:hover:translate-y-0',
          className,
        )}
      >
        {inner}
      </Link>
    );
  }
  return <div className={cn(base, className)}>{inner}</div>;
}
