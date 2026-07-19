'use client';

import { ArrowLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useBooks, Book } from '@/features/bible/api/get-books';
import { useSearchBible } from '@/features/bible/api/search-bible';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/utils/cn';

import { BibleOpeningQuote } from './bible-opening-quote';
import { ChapterReading } from './chapter-reading';

type Testament = 'ancien' | 'nouveau' | 'psaume';

const TESTAMENTS: { value: Testament; label: string }[] = [
  { value: 'ancien', label: 'Ancien Testament' },
  { value: 'nouveau', label: 'Nouveau Testament' },
  { value: 'psaume', label: 'Psaumes' },
];

function HighlightText({
  text,
  highlight,
  enabled,
}: {
  text: string;
  highlight: string;
  enabled: boolean;
}) {
  const term = highlight.trim();
  if (!enabled || !term) return <span>{text}</span>;
  // Échapper les métacaractères regex (un terme « ( » ou « * » crashait).
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safe})`, 'gi'));
  const lower = term.toLowerCase();
  return (
    <span>
      {parts.map((part, i) =>
        // Comparaison insensible à la casse (pas de regex.test /g stateful).
        part.toLowerCase() === lower ? (
          <mark
            key={i}
            className="rounded-sm bg-primary/30 px-1 font-medium text-secondary-foreground"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

/* ─── Niveau 2 : choix du chapitre ─── */

function ChapterSelection({
  book,
  onSelect,
  onBack,
}: {
  book: Book;
  onSelect: (chapter: number) => void;
  onBack: () => void;
}) {
  const chapters = Array.from(
    { length: book.chapter_count ?? 0 },
    (_, i) => i + 1,
  );

  return (
    <div>
      <Button
        variant="ghost"
        onClick={onBack}
        className="-ml-2 mb-6 h-11 text-muted-foreground"
        icon={<ArrowLeft className="size-4" aria-hidden="true" />}
      >
        Retour aux livres
      </Button>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Choisir un chapitre
        </p>
        <h2 className="mt-2 font-serif text-title font-bold tracking-tight text-foreground">
          {book.name}
        </h2>
        <div className="hairline-gold mt-4" aria-hidden="true" />
      </header>

      {chapters.length === 0 ? (
        <EmptyState
          title="Aucun chapitre disponible"
          description="Ce livre n’a pas encore de chapitres dans la bibliothèque. Revenez à la liste pour en choisir un autre."
        />
      ) : (
        // Cibles ≥ 44px (R3) : on lit ce sélecteur sur un téléphone, souvent
        // d'une main. Pas de boîte à défilement interne : la page défile.
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
          {chapters.map((chapter) => (
            <button
              key={chapter}
              type="button"
              onClick={() => onSelect(chapter)}
              className="flex h-12 items-center justify-center rounded-lg bg-secondary text-base font-semibold tabular-nums text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {chapter}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Niveau 1 : recherche + livres ─── */

export function BibleBooksTab() {
  const [search, setSearch] = useState('');
  const [isHybrid, setIsHybrid] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const [selectedTestament, setSelectedTestament] =
    useState<Testament>('ancien');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const isSearching = debouncedSearch.trim().length >= 3;

  const {
    data: books,
    isLoading,
    isError,
    refetch: refetchBooks,
  } = useBooks({ testament: selectedTestament });

  const {
    data: searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
    refetch: refetchSearch,
  } = useSearchBible({
    q: debouncedSearch.trim(),
    hybrid: isHybrid,
    testament: selectedTestament,
  });

  /** Ouvre un verset trouvé par la recherche à son chapitre. */
  const openSearchMatch = (
    group: NonNullable<typeof searchResults>[number],
    chapterNumber: number | undefined,
  ) => {
    setSelectedTestament(group.book.testament as Testament);
    const fullBook = books?.find((b) => b.id === group.book.id) ?? {
      ...group.book,
      chapter_count: 50,
      verse_count: undefined,
    };
    setSelectedBook(fullBook as Book);
    setSelectedChapter(chapterNumber ?? 1);
  };

  if (selectedChapter && selectedBook) {
    return (
      <ChapterReading
        book={selectedBook}
        chapterNumber={selectedChapter}
        onBack={() => setSelectedChapter(null)}
      />
    );
  }

  if (selectedBook) {
    return (
      <ChapterSelection
        book={selectedBook}
        onSelect={setSelectedChapter}
        onBack={() => setSelectedBook(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Ouverture éditoriale — présente uniquement ici : elle disparaît dès
          qu'on entre dans un chapitre, pour laisser le texte seul en scène. */}
      <BibleOpeningQuote className="mb-1" />

      {/* Recherche — hauteur 44px (R3). */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            placeholder="Rechercher un terme exact (min. 3 lettres)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher dans la Bible"
            className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 pl-10 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <label
          htmlFor="hybrid-search"
          className="flex min-h-11 cursor-pointer items-center gap-2.5 px-1"
        >
          <Checkbox
            id="hybrid-search"
            checked={isHybrid}
            onCheckedChange={(checked) => setIsHybrid(checked === true)}
          />
          <span className="text-sm font-medium leading-none">
            Sémantique IA (Recherche Intelligente)
          </span>
        </label>
      </div>

      {/* Testament — cibles ≥ 44px. */}
      <div role="group" aria-label="Testament" className="flex gap-2">
        {TESTAMENTS.map((t) => {
          const active = selectedTestament === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setSelectedTestament(t.value)}
              aria-pressed={active}
              className={cn(
                'min-h-11 flex-1 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active
                  ? 'bg-primary text-primary-foreground shadow-soft-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {isSearching ? (
        <SearchResultsView
          isLoading={isSearchLoading}
          isError={isSearchError}
          onRetry={() => void refetchSearch()}
          results={searchResults}
          query={debouncedSearch}
          isHybrid={isHybrid}
          onOpenMatch={openSearchMatch}
        />
      ) : isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState
          title="Les livres n’ont pas pu être chargés"
          description="La bibliothèque n’a pas répondu. Vous pouvez réessayer maintenant."
          onRetry={() => void refetchBooks()}
        />
      ) : !Array.isArray(books) || books.length === 0 ? (
        <EmptyState
          title="Aucun livre dans cette section"
          description="Choisissez un autre testament ci-dessus, ou recherchez directement un verset par son texte."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {[...books]
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map((book) => (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => setSelectedBook(book)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background-surface px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-base font-semibold text-foreground">
                      {book.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {book.chapter_count} chapitres
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Résultats de recherche ─── */

interface SearchResultsViewProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  results: ReturnType<typeof useSearchBible>['data'];
  query: string;
  isHybrid: boolean;
  onOpenMatch: (
    group: NonNullable<ReturnType<typeof useSearchBible>['data']>[number],
    chapterNumber: number | undefined,
  ) => void;
}

function SearchResultsView({
  isLoading,
  isError,
  onRetry,
  results,
  query,
  isHybrid,
  onOpenMatch,
}: SearchResultsViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground" role="status">
          Recherche dans les Écritures…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="La recherche n’a pas abouti"
        description="Le moteur de recherche n’a pas répondu. Vous pouvez relancer la recherche."
        onRetry={onRetry}
        retryLabel="Relancer la recherche"
      />
    );
  }

  if (!Array.isArray(results) || results.length === 0) {
    return (
      <EmptyState
        icon={<Search />}
        title={`Aucun verset ne contient « ${query} »`}
        description="Essayez un mot plus court, une autre orthographe, ou activez la recherche sémantique pour trouver des passages proches du sens plutôt que des mots exacts."
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {results.map((group) => (
        <section key={group.book.id} aria-labelledby={`book-${group.book.id}`}>
          <h3
            id={`book-${group.book.id}`}
            className="mb-3 font-serif text-lg font-bold text-foreground"
          >
            {group.book.name}
          </h3>
          <div className="hairline-gold mb-3" aria-hidden="true" />
          <ul className="flex flex-col gap-2.5">
            {group.matches.map((match) => {
              const chapterNumber = (
                match.verse.chapter as { number?: number }
              )?.number;
              return (
                <li key={match.verse.id}>
                  <button
                    type="button"
                    onClick={() => onOpenMatch(group, chapterNumber)}
                    className="w-full rounded-xl border border-border bg-background-surface p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="mb-1.5 block text-xs font-bold text-primary">
                      {group.book.name} {chapterNumber}:{match.verse.number}
                    </span>
                    <span className="block text-sm leading-relaxed text-foreground">
                      <HighlightText
                        text={match.verse.text}
                        highlight={query}
                        enabled={!isHybrid}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
