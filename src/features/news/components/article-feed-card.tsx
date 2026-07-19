import { Clock, Eye, Newspaper } from 'lucide-react';
import Image from 'next/image';

import { Link } from '@/components/ui/link/link';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import type { Article } from '../types';

import { ArticleReactionsBar } from './article-reactions';
import { ArticleTypeBadge } from './article-type-badge';

/**
 * Les trois traitements du fil (R6 « Flux »). Ils ne sont pas trois tailles
 * d'une même carte : ce sont trois formes différentes, ce qui donne au fil un
 * tempo au lieu d'une grille.
 *
 * - `lead`  : la une. Visuel panoramique pleine largeur, titre `text-headline`.
 * - `wide`  : bande pleine largeur, vignette latérale (alternée gauche/droite).
 * - `brief` : brève typographique, sans visuel, dans la liste « En bref ».
 */
export type FeedCardVariant = 'lead' | 'wide' | 'brief';

interface ArticleFeedCardProps {
  article: Article;
  variant?: FeedCardVariant;
  /** `wide` uniquement : visuel à droite — zigzag éditorial, pas de colonne. */
  reverse?: boolean;
}

/**
 * Carte du fil d'actualité, registre **bleu dominant** (l'or n'apparaît que sur
 * le badge « Lettre pastorale », via `ArticleTypeBadge`).
 *
 * Lisibilité (R3) : titres en sérif à forte échelle, chapô et métadonnées en
 * `text-foreground/…` plutôt qu'en gris clair, surface de clic occupant tout le
 * bloc. Les visuels ont un ratio fixe et un repli au même ratio : zéro saut de
 * mise en page au chargement.
 */
export function ArticleFeedCard({
  article,
  variant = 'wide',
  reverse = false,
}: ArticleFeedCardProps) {
  // Appareil éditorial commun : date + audience. Volontairement à 13 px et non
  // en gris clair — c'est la ligne la plus souvent illisible en plein soleil.
  const meta = (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-foreground/65">
      {article.published_at && (
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatFrDate(article.published_at, 'short')}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <Eye className="size-3.5" aria-hidden="true" />
        {article.views_count}
      </span>
    </div>
  );

  // Surtitre de rubrique. Bleu dans les deux thèmes, mais PAS le même bleu :
  // `--primary` (#1A8FCC) ne tient que ~3,5:1 sur blanc, insuffisant pour du
  // 12 px (R3). En clair on descend sur le bleu profond, en sombre on reprend
  // `--primary` qui, lui, contraste largement sur le navy.
  const kicker = (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <ArticleTypeBadge contentType={article.content_type} />
      {article.category && (
        <span className="text-xs font-semibold uppercase tracking-widest text-secondary-foreground dark:text-primary">
          {article.category.name}
        </span>
      )}
    </div>
  );

  // --- Brève : pas de visuel, la typographie seule porte l'item. ------------
  if (variant === 'brief') {
    return (
      <Link
        href={`/app/actus/${article.id}`}
        className="group flex items-start gap-3.5 py-4"
      >
        <span
          aria-hidden="true"
          className="mt-2.5 size-2 shrink-0 rounded-full bg-primary"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold leading-snug text-foreground underline-offset-4 group-hover:text-primary group-hover:underline">
            {article.title}
          </h3>
          {meta}
        </div>
      </Link>
    );
  }

  // La barre de réactions vit HORS du <Link> : un <button> imbriqué dans une
  // ancre est du HTML invalide, et le clic déclencherait la navigation au lieu
  // de la réaction. La brève, elle, reste purement typographique — on y accède
  // par l'article.
  const reactionsBar = (
    <ArticleReactionsBar
      articleId={article.id}
      reactions={article.reactions}
      size="compact"
    />
  );

  // --- Bande pleine largeur : vignette latérale, alternée gauche/droite. ----
  if (variant === 'wide') {
    return (
      <article className="flex flex-col gap-3">
        <Link
          href={`/app/actus/${article.id}`}
          className={cn(
            'group flex gap-4 md:gap-6',
            reverse && 'md:flex-row-reverse',
          )}
        >
          <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40 sm:rounded-xl md:w-[38%]">
            {article.cover_image_url ? (
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03] motion-reduce:transform-none"
                sizes="(max-width: 640px) 112px, (max-width: 1024px) 160px, 380px"
              />
            ) : (
              <div
                data-testid="article-card-placeholder"
                aria-hidden="true"
                className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-primary/5 text-primary/60"
              >
                <Newspaper className="size-7" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            {kicker}
            <h3 className="font-serif text-xl font-bold leading-snug tracking-tight text-foreground underline-offset-4 group-hover:text-primary group-hover:underline md:text-2xl">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-foreground/75">
                {article.excerpt}
              </p>
            )}
            {meta}
          </div>
        </Link>
        {reactionsBar}
      </article>
    );
  }

  // --- La une : elle doit écraser tout ce qui suit (échelle, image, place). -
  return (
    <article className="flex flex-col gap-4">
      <Link href={`/app/actus/${article.id}`} className="group flex flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-video md:aspect-[21/9]">
          {article.cover_image_url ? (
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              unoptimized
              priority
              className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03] motion-reduce:transform-none"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          ) : (
            <div
              data-testid="article-card-placeholder"
              aria-hidden="true"
              className="flex size-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-primary/5 text-primary/60"
            >
              <Newspaper className="size-14" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col pt-4">
          {kicker}
          <h3 className="font-serif text-headline font-bold tracking-tight text-foreground underline-offset-4 group-hover:text-primary group-hover:underline">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 line-clamp-3 max-w-reading text-base leading-relaxed text-foreground/75 md:text-lg">
              {article.excerpt}
            </p>
          )}
          {meta}
        </div>
      </Link>
      {reactionsBar}
    </article>
  );
}
