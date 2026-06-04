'use client';

import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table/table';
import { cn } from '@/utils/cn';

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Libellé court en vue carte mobile (défaut = header). */
  mobileLabel?: string;
  className?: string;
  headClassName?: string;
  /** Ne pas afficher cette colonne dans la carte mobile. */
  hideOnMobile?: boolean;
  /** Colonne d'actions (rendue en pied de carte, sans libellé). */
  isAction?: boolean;
}

export interface OffsetPagination {
  /** Total d'éléments (LimitOffsetPagination `count`). */
  count: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  caption?: string;
  emptyState?: React.ReactNode;
  pagination?: OffsetPagination;
}

/**
 * Table de données responsive, construite sur le primitive `ui/table`.
 * - Desktop : table sémantique (`scope=col`, caption).
 * - Mobile : transformation en cartes label/valeur.
 * - Pagination LimitOffset (« X–Y sur Z » + Précédent/Suivant).
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading,
  caption,
  emptyState,
  pagination,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <>
        {emptyState ?? (
          <EmptyState
            icon={<Inbox />}
            title="Aucun élément"
            description="Rien à afficher pour le moment."
          />
        )}
      </>
    );
  }

  const mobileCols = columns.filter((c) => !c.hideOnMobile && !c.isAction);
  const actionCols = columns.filter((c) => c.isAction);

  return (
    <div>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <TableElement>
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  scope="col"
                  className={cn('px-4', col.headClassName)}
                >
                  {col.isAction ? (
                    <span className="sr-only">{col.header}</span>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((col, i) => (
                  <TableCell key={i} className={cn('px-4 py-3', col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      </div>

      {/* Mobile : cartes */}
      <ul className="space-y-3 md:hidden">
        {data.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-xl border border-border bg-card p-4 shadow-soft-sm"
          >
            <dl className="space-y-1.5">
              {mobileCols.map((col, i) => (
                <div key={i} className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-xs font-medium text-muted-foreground">
                    {col.mobileLabel ?? col.header}
                  </dt>
                  <dd className="min-w-0 text-right text-sm text-foreground">
                    {col.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>
            {actionCols.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                {actionCols.map((col, i) => (
                  <React.Fragment key={i}>{col.cell(row)}</React.Fragment>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {pagination && <DataTablePagination {...pagination} />}
    </div>
  );
}

function DataTablePagination({
  count,
  limit,
  offset,
  onOffsetChange,
}: OffsetPagination) {
  const from = count === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, count);
  const canPrev = offset > 0;
  const canNext = offset + limit < count;

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {from}–{to} sur {count}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          icon={<ChevronLeft className="size-4" />}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onOffsetChange(offset + limit)}
        >
          Suivant
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
