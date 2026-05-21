'use client';

import { ChevronRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

import { useDocumentRequests } from '../api/get-documents';
import { DocumentStatus } from '../types';

import { DocumentStatusBadge } from './document-status-badge';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const statusStripe: Record<DocumentStatus, string> = {
  submitted: 'bg-primary',
  under_verification: 'bg-warning',
  validated: 'bg-success',
  document_deposited: 'bg-teal-500',
  info_requested: 'bg-orange-500',
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FileText className="size-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Aucune demande</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos demandes de documents apparaîtront ici.
        </p>
      </div>
      <Link
        href="/app/documents/new"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" />
        Nouvelle demande
      </Link>
    </div>
  );
}

export function DocumentsList() {
  const { data, isLoading, isError } = useDocumentRequests();

  return (
    <div className="relative flex flex-col">
      <PageHeader
        title="Documents"
        subtitle="Demandes de documents officiels"
        action={
          <Link
            href="/app/documents/new"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            aria-label="Nouvelle demande"
          >
            <Plus className="size-5" />
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-2xl px-4 py-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        {isLoading && <DocumentsSkeleton />}
        {isError && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Impossible de charger vos demandes.
          </p>
        )}
        {!isLoading && !isError && !data?.results.length && <EmptyState />}
        {!isLoading && !isError && !!data?.results.length && (
          <div className="flex flex-col gap-3">
            {data.results.map((doc) => (
              <Link
                key={doc.id}
                href={paths.app.document.getHref(String(doc.id))}
                className="group flex overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
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
                      {doc.document_type}
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

      {/* FAB — New request */}
      <Link
        href="/app/documents/new"
        className="fixed bottom-24 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl md:bottom-6"
        aria-label="Nouvelle demande"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
