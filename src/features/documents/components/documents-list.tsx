'use client';

import { ChevronRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layouts/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import { useDocumentRequests } from '../api/get-documents';
import { DocumentStatus } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

import { DocumentStatusBadge } from './document-status-badge';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Liseré coloré aligné sur le ton du badge de statut. */
const statusStripe: Record<DocumentStatus, string> = {
  submitted: 'bg-info',
  under_verification: 'bg-warning',
  validated: 'bg-success',
  document_deposited: 'bg-primary',
  info_requested: 'bg-accent',
  rejected: 'bg-destructive',
};

function DocumentsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="w-1 shrink-0 bg-muted" />
          <div className="flex flex-1 items-center gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DocumentsListProps {
  hideHeader?: boolean;
}

export function DocumentsList({ hideHeader = false }: DocumentsListProps) {
  const { data, isLoading, isError, refetch } = useDocumentRequests();

  return (
    <div className="relative flex flex-col">
      {!hideHeader && (
        <PageHeader
          title="Documents"
          subtitle="Demandes de documents officiels"
          action={
            <Link
              href="/app/documents/new"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-sm hover:bg-primary/90"
              aria-label="Nouvelle demande"
            >
              <Plus className="size-5" />
            </Link>
          }
        />
      )}

      <div className="mx-auto w-full max-w-2xl px-4 py-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        {isLoading && <DocumentsSkeleton />}
        {isError && (
          <ErrorState
            title="Impossible de charger vos demandes"
            onRetry={() => refetch()}
          />
        )}
        {!isLoading && !isError && !data?.results.length && (
          <EmptyState
            icon={<FileText />}
            title="Aucune demande"
            description="Vos demandes de documents apparaîtront ici."
            action={
              <Link
                href="/app/documents/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none"
              >
                <Plus className="size-4" />
                Nouvelle demande
              </Link>
            }
          />
        )}
        {!isLoading && !isError && !!data?.results.length && (
          <div className="flex flex-col gap-3">
            {data.results.map((doc) => (
              <Link
                key={doc.id}
                href={paths.app.document.getHref(String(doc.id))}
                className="group flex overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99]"
              >
                <div
                  className={cn(
                    'w-1 shrink-0 transition-all group-hover:w-1.5',
                    statusStripe[doc.status],
                  )}
                />
                <div className="flex flex-1 items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {formatDocumentType(doc.document_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <DocumentStatusBadge status={doc.status} />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
