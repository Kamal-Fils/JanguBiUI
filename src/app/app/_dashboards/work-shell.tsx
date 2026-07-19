'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Vocabulaire commun aux trois tableaux de bord du clergé.
 *
 * Archétype **Travail** (DIRECTION R6) : dense, zéro ornement décoratif,
 * l'information utile par unité de surface, l'action visible d'emblée.
 *
 * Ce que ces blocs remplacent — et pourquoi :
 *
 * - le **héros dégradé** (bandeau plein écran, trame de points, croix en SVG,
 *   prénom en `text-display` serif italique) occupait le premier écran entier
 *   pour dire une chose sans valeur d'usage : votre prénom. Un curé n'ouvre pas
 *   son tableau de bord pour se voir salué, il l'ouvre pour savoir **ce qu'il
 *   doit faire aujourd'hui** (R1, R2) ;
 * - les **tuiles d'accès rapide colorées** et les **filets or** entre chaque
 *   section : c'est du décor qui ralentit un écran de travail (R6, §5).
 *
 * Le bleu reste l'identité (R4) mais il tient par un filet et par l'action,
 * jamais par un lavis qui mange la donnée.
 */

// ── Bande de contexte ────────────────────────────────────────────────────────

interface WorkHeaderProps {
  /** Périmètre d'autorité : « Espace pastoral », « Conduite du diocèse »… */
  scope: string;
  /** Sujet de l'écran, en clair. */
  title: string;
  /** Entité rattachée (paroisse, diocèse, province) si connue. */
  entity?: string;
}

/**
 * Une bande plate : surtitre de périmètre, sujet, date. Pas de dégradé, pas de
 * texture — la hiérarchie vient de l'échelle du titre, pas de la surface (R2).
 */
export function WorkHeader({ scope, title, entity }: WorkHeaderProps) {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="border-l-4 border-primary pl-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        {scope}
        {entity ? ` · ${entity}` : ''}
      </p>
      <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-0.5 text-sm capitalize text-muted-foreground">
        {dateStr}
      </p>
    </header>
  );
}

// ── Ce qui attend une action ─────────────────────────────────────────────────

export interface WorkTask {
  /**
   * Libellés singulier / pluriel, tous deux explicites.
   *
   * Ces libellés sont des **locutions** (« intention à accepter », « demande de
   * document ») : le français ne les met pas au pluriel en ajoutant un « s »
   * à la fin — on écrit « intentions à accepter », pas « intention à
   * accepters ». Un helper générique produisait donc des libellés fautifs.
   */
  label: { one: string; many: string };
  count: number;
  href: string;
  isLoading?: boolean;
}

interface TodayQueueProps {
  tasks: WorkTask[];
}

/**
 * Le sujet de l'écran (R2) : combien d'actes attendent, et un chemin direct
 * vers chacun. Placé en tête parce que c'est la raison d'ouvrir la page — et
 * chaque file est atteignable en **un** tap (R1).
 */
export function TodayQueue({ tasks }: TodayQueueProps) {
  const pending = tasks.filter((t) => !t.isLoading);
  const isLoading = tasks.some((t) => t.isLoading);
  const total = pending.reduce((sum, t) => sum + t.count, 0);
  const actionable = pending.filter((t) => t.count > 0);

  return (
    <section
      aria-labelledby="today-queue-title"
      className="rounded-xl border border-border bg-card p-4 shadow-soft-sm sm:p-5"
    >
      <h2
        id="today-queue-title"
        className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        À traiter aujourd’hui
      </h2>

      {isLoading ? (
        <Skeleton className="mt-2 h-9 w-56" />
      ) : total === 0 ? (
        <p className="mt-1.5 text-lg font-semibold text-foreground">
          Rien ne vous attend.
        </p>
      ) : (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 text-foreground">
          <span className="text-4xl font-bold tabular-nums leading-none text-primary">
            {total}
          </span>
          <span className="text-base font-medium">
            {total > 1 ? 'demandes vous attendent' : 'demande vous attend'}
          </span>
        </p>
      )}

      {actionable.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-border border-t border-border">
          {actionable.map((task) => (
            <li key={task.href}>
              <Link
                href={task.href}
                className="group flex min-h-11 items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="min-w-0 truncate font-medium text-foreground group-hover:text-primary">
                  <span className="tabular-nums">{task.count}</span>{' '}
                  {task.count > 1 ? task.label.many : task.label.one}
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Section de travail ───────────────────────────────────────────────────────

interface WorkSectionProps {
  title: string;
  /** Compteur affiché à côté du titre — la charge se lit sans ouvrir. */
  count?: number;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * En-tête de section sobre : ni titre serif, ni filet or, ni surtitre décoratif.
 * `SectionHeader` porte le registre éditorial des écrans de lecture — ici il
 * ajouterait de l'ornement sur un écran dont le seul métier est d'aller vite.
 */
export function WorkSection({
  title,
  count,
  actionHref,
  actionLabel = 'Tout voir',
  children,
  className,
}: WorkSectionProps) {
  const headingId = `work-section-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
        <h2
          id={headingId}
          className="text-sm font-semibold text-foreground"
        >
          {title}
          {count != null && count > 0 && (
            <span className="ml-2 text-xs font-medium tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
        </h2>
        {actionHref && (
          <Link
            href={actionHref}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// ── États partagés ───────────────────────────────────────────────────────────

/** Rangée vide, discrète : un écran de travail vide est une bonne nouvelle. */
export function WorkEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** Squelette de lignes denses, au gabarit des rangées réelles. */
export function WorkRowsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}
