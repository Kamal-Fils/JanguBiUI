import { Newspaper } from 'lucide-react';
import Image from 'next/image';

interface ArticleHeroProps {
  /** URL de la couverture — bandeau éditorial de repli si absente. */
  imageUrl?: string | null;
  alt: string;
}

/**
 * Bannière d'ouverture « presse » du détail d'article (inspiration NYT/BBC) :
 * image pleine largeur de la colonne AU-DESSUS du titre, ratio 16/9 stable
 * (zéro CLS). Sans image, un bandeau éditorial dégradé à ratio stable (3/1)
 * garde l'ouverture visuelle sans trou de mise en page.
 */
export function ArticleHero({ imageUrl, alt }: ArticleHeroProps) {
  if (imageUrl) {
    return (
      <figure className="relative aspect-video w-full overflow-hidden bg-muted md:rounded-xl">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          unoptimized
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      </figure>
    );
  }

  return (
    <div
      data-testid="article-hero-placeholder"
      aria-hidden="true"
      className="flex aspect-[3/1] w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 md:rounded-xl"
    >
      <Newspaper className="size-9 text-primary/40" />
    </div>
  );
}
