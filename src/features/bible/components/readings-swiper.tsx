'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import type { LiturgyReading } from '../api/get-liturgy-today';
import {
  getReadingAccentClass,
  normalizeReadingLabel,
} from '../utils/reading-labels';

interface ReadingMeta {
  titre?: string;
  introLue?: string;
  refrain?: string;
  versetEvangile?: string;
}

function extractMeta(reading: LiturgyReading): ReadingMeta {
  const meta = reading.raw_metadata as Record<string, unknown> | null;
  if (!meta) return {};
  return {
    titre: typeof meta.titre === 'string' ? meta.titre : undefined,
    introLue: typeof meta.intro_lue === 'string' ? meta.intro_lue : undefined,
    refrain:
      typeof meta.refrain_psalmique === 'string'
        ? meta.refrain_psalmique
        : undefined,
    versetEvangile:
      typeof meta.verset_evangile === 'string'
        ? meta.verset_evangile
        : undefined,
  };
}

interface ReadingPanelProps {
  reading: LiturgyReading;
  fontSize: number;
}

function ReadingPanel({ reading, fontSize }: ReadingPanelProps) {
  const label = normalizeReadingLabel(reading.type ?? '');
  const accentClass = getReadingAccentClass(label);
  const { titre, introLue, refrain, versetEvangile } = extractMeta(reading);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-5">
        <h2 className={cn('text-lg font-semibold', accentClass)}>{label}</h2>
        {titre && (
          <p className="mt-1.5 text-sm font-semibold italic text-foreground/90">
            {titre}
          </p>
        )}
        {reading.citation && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {reading.citation}
          </p>
        )}
      </header>

      {/* Alléluia verse before the gospel (HTML) */}
      {versetEvangile && (
        <div
          className="mb-5 rounded-xl border border-amber-500/20 bg-amber-50/50 px-4 py-3 dark:bg-amber-900/10 reading-content"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(versetEvangile),
          }}
        />
      )}

      {/* Intro lue — italic line before main text */}
      {introLue && (
        <p className="mb-4 text-sm italic text-muted-foreground">{introLue}</p>
      )}

      {/* Refrain psalmique (HTML) */}
      {refrain && (
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-primary/70">
            Refrain
          </p>
          <div
            className="text-sm font-medium leading-relaxed text-foreground reading-content"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(refrain) }}
          />
        </div>
      )}

      {/* Main text */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none pb-8 prose-p:text-foreground/80 prose-strong:text-foreground reading-content"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(reading.text ?? ''),
        }}
      />
    </div>
  );
}

interface ReadingsSwiperProps {
  readings: LiturgyReading[];
  fontSize: number;
}

export function ReadingsSwiper({ readings, fontSize }: ReadingsSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(idx);
      const activeTab = tabsRef.current?.children[idx] as
        | HTMLElement
        | undefined;
      activeTab?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el || typeof el.scrollTo !== 'function') return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  if (readings.length === 0) {
    return (
      <div className="py-16 text-center text-sm italic text-muted-foreground">
        Aucune lecture disponible pour cette date.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div
        ref={tabsRef}
        className="sticky top-0 z-10 flex overflow-x-auto border-b border-border bg-background/95 backdrop-blur-md"
        style={{ scrollbarWidth: 'none' }}
      >
        {readings.map((r, i) => {
          const label = normalizeReadingLabel(r.type ?? '');
          const isActive = i === activeIndex;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Swipeable panels */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-scroll"
        style={
          {
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties
        }
      >
        {readings.map((r) => (
          <div key={r.id} className="w-full shrink-0 snap-start">
            <ReadingPanel reading={r} fontSize={fontSize} />
          </div>
        ))}
      </div>
    </div>
  );
}
