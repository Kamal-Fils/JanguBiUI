'use client';

import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft, Minus, Plus, Bookmark } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';

interface ReadingViewProps {
  title: string;
  reference: string;
  text: string;
  refrain?: string;
  isHtml?: boolean;
  onBack: () => void;
}

export function ReadingView({
  title,
  reference,
  text,
  refrain,
  isHtml,
  onBack,
}: ReadingViewProps) {
  const [fontSize, setFontSize] = useState(16);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setFontSize((s) => Math.max(12, s - 2))}
            aria-label="Reduire la taille du texte"
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-8 text-center text-xs text-muted-foreground">
            {fontSize}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setFontSize((s) => Math.min(24, s + 2))}
            aria-label="Augmenter la taille du texte"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Marquer comme favori"
          >
            <Bookmark className="size-4" />
          </Button>
        </div>
      </div>

      {/* Reading content */}
      <article
        className="bg-background-surface mx-auto w-full rounded-xl p-6"
        style={{ maxWidth: '720px' }}
      >
        <header className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-primary">{reference}</p>
        </header>
        {refrain && (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
              Refrain
            </p>
            <p className="font-serif text-base font-semibold italic leading-snug text-foreground">
              {refrain}
            </p>
          </div>
        )}
        {isHtml ? (
          <div
            className="prose dark:prose-invert prose-sm max-w-none pb-8 prose-p:text-foreground/80 prose-strong:text-foreground prose-hr:border-muted reading-content"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
          />
        ) : (
          <div
            className="text-foreground-secondary whitespace-pre-line leading-relaxed pb-8"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
          >
            {text}
          </div>
        )}
      </article>
    </div>
  );
}
