import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

import { Link } from '@/components/ui/link/link';
import { cn } from '@/utils/cn';

const aspectClass = {
  video: 'aspect-video',
  square: 'aspect-square',
  wide: 'aspect-[3/1]',
  portrait: 'aspect-[4/5]',
};

interface MediaCardProps {
  href: string;
  image?: string | null;
  imageAlt?: string;
  aspect?: keyof typeof aspectClass;
  /** Icône affichée dans le repli quand il n'y a pas d'image. */
  fallbackIcon?: React.ReactNode;
  /** Pastilles / catégorie au-dessus du titre. */
  overline?: React.ReactNode;
  title: string;
  excerpt?: string;
  /** Méta de pied (date, vues…). */
  meta?: React.ReactNode;
  /** Mise en avant (titre serif plus grand). */
  featured?: boolean;
  className?: string;
}

/**
 * Carte média unifiée (actus, TV…) : slot média TOUJOURS réservé avec un repli
 * brandé (jamais de reflow), titre, extrait, méta. next/image en `unoptimized`
 * car les couvertures vivent sur des hôtes MinIO/S3 arbitraires.
 */
export function MediaCard({
  href,
  image,
  imageAlt = '',
  aspect = 'video',
  fallbackIcon,
  overline,
  title,
  excerpt,
  meta,
  featured = false,
  className,
}: MediaCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none',
        className,
      )}
    >
      <div className={cn('relative w-full overflow-hidden', aspectClass[aspect])}>
        {image ? (
          <Image
            src={image}
            alt={imageAlt}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03] motion-reduce:transform-none"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 text-primary/40 [&_svg]:size-10">
            {fallbackIcon ?? <ImageIcon className="size-10" aria-hidden="true" />}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        {overline && (
          <div className="mb-1.5 flex flex-wrap items-center gap-2">{overline}</div>
        )}
        <h3
          className={cn(
            'font-semibold leading-snug text-foreground',
            featured ? 'font-serif text-xl' : 'line-clamp-2 text-base',
          )}
        >
          {title}
        </h3>
        {excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {excerpt}
          </p>
        )}
        {meta && (
          <div className="mt-auto pt-3 text-xs text-muted-foreground">{meta}</div>
        )}
      </div>
    </Link>
  );
}
