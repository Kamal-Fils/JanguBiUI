'use client';

import { Archive, Download, FileCheck } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { useDocumentRequests } from '../api/get-documents';
import { formatDocumentType } from '../utils/format-document-type';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function VaultSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-4 space-y-3"
        >
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function VaultContent() {
  const { data, isLoading, isError, refetch } = useDocumentRequests({
    status: 'document_deposited',
  });
  const documents = data?.results ?? [];

  if (isLoading) return <VaultSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger vos documents"
        onRetry={() => refetch()}
      />
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<Archive />}
        title="Coffre-fort vide"
        description="Vos documents officiels émis par la paroisse apparaîtront ici."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={paths.app.document.getHref(doc.id)}
          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99] motion-reduce:transform-none"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
              <FileCheck className="size-5 text-success" />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <Download className="size-3" />
              Disponible
            </span>
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground line-clamp-2">
              {formatDocumentType(doc.document_type)}
            </p>
            {doc.parish_name && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {doc.parish_name}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Délivré le {formatDate(doc.updated_at ?? doc.created_at)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
