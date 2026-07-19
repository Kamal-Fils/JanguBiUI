'use client';

import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FontSizeStepper } from '@/components/ui/font-size-stepper';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/features/bible/api/get-books';
import { useInfiniteVerses } from '@/features/bible/api/get-verses';

const VERSE_PAGE_SIZE = 50;

/** Confort de lecture par défaut — au-dessus du 16px habituel (cible âgée, R3). */
const DEFAULT_FONT_SIZE = 18;

function VersesSkeleton() {
  return (
    <div className="max-w-reading space-y-5" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="mt-1 size-4 shrink-0 rounded" />
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className={i % 3 === 0 ? 'h-4 w-2/3' : 'h-4 w-11/12'} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ChapterReadingProps {
  book: Book;
  chapterNumber: number;
  onBack: () => void;
}

/**
 * Lecture d'un chapitre — archétype **Lecture** (DIRECTION.md R6).
 *
 * Le texte est le sujet : il porte seul la mesure de lecture (~68ch via
 * `max-w-reading`), aligné dans le cadre standard de la page. Le cadre n'est
 * PAS rétréci et la colonne n'est PAS recentrée : un `mx-auto` + `max-width`
 * posé sur la carte laissait deux bandes mortes sur les côtés — c'est
 * exactement le « trop de marge auto » signalé par le client.
 *
 * Le chrome reste minimal pendant la lecture : un retour, un réglage de
 * taille, rien d'autre entre le fidèle et la Parole.
 */
export function ChapterReading({
  book,
  chapterNumber,
  onBack,
}: ChapterReadingProps) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteVerses({
    bookId: book.id,
    chapterNumber,
    limit: VERSE_PAGE_SIZE,
  });

  const verses = data?.pages.flat() ?? [];

  return (
    <div className="pb-10">
      <Button
        variant="ghost"
        onClick={onBack}
        className="-ml-2 mb-6 h-11 text-muted-foreground"
        icon={<ArrowLeft className="size-4" aria-hidden="true" />}
      >
        Retour aux chapitres
      </Button>

      {/* Ouverture : l'échelle porte la hiérarchie (R2) — le livre et le
          chapitre se lisent sans effort, le reste est de l'appareil. */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {book.name}
        </p>
        <h2 className="mt-2 font-serif text-headline font-bold tracking-tight text-foreground">
          Chapitre {chapterNumber}
        </h2>
        <div className="mt-5 flex items-center gap-4">
          <div className="hairline-gold min-w-0 flex-1" aria-hidden="true" />
          <FontSizeStepper
            value={fontSize}
            onChange={setFontSize}
            min={16}
            max={26}
          />
        </div>
      </header>

      {isLoading ? (
        <VersesSkeleton />
      ) : isError ? (
        <ErrorState
          title="Ce chapitre n’a pas pu être chargé"
          description="La liaison avec le serveur n’a pas répondu. Vous pouvez réessayer maintenant."
          onRetry={() => void refetch()}
        />
      ) : verses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Ce chapitre est encore vide"
          description="Le texte de ce chapitre n’a pas encore été versé dans la bibliothèque. Choisissez un autre chapitre en attendant."
        />
      ) : (
        <>
          {/* Seule la colonne de TEXTE porte la mesure de lecture. */}
          <div
            className="max-w-reading"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {verses.map((verse) => (
              <p key={verse.id} className="mb-4 text-foreground">
                <span
                  className="mr-2 align-baseline text-sm font-bold tabular-nums text-primary"
                  aria-hidden="true"
                >
                  {verse.number}
                </span>
                {verse.text}
              </p>
            ))}
          </div>

          {hasNextPage && (
            <div className="max-w-reading mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="h-11 w-full"
                icon={
                  isFetchingNextPage ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : undefined
                }
              >
                {isFetchingNextPage ? 'Chargement…' : 'Lire la suite'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
