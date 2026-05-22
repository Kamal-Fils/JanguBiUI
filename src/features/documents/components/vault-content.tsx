'use client';

import { Archive, Download, FileCheck } from 'lucide-react';
import Link from 'next/link';

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
        <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function VaultContent() {
  const { data, isLoading, isError } = useDocumentRequests({ status: 'document_deposited' });
  const documents = data?.results ?? [];

  if (isLoading) return <VaultSkeleton />;

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">
          Impossible de charger vos documents. Veuillez réessayer.
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Archive className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Coffre-fort vide</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vos documents officiels émis par la paroisse apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={paths.app.document.getHref(doc.id)}
          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10">
              <FileCheck className="size-5 text-teal-600" />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-700">
              <Download className="size-3" />
              Disponible
            </span>
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground line-clamp-2">
              {formatDocumentType(doc.document_type)}
            </p>
            {doc.parish_name && (
              <p className="mt-0.5 text-xs text-muted-foreground">{doc.parish_name}</p>
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
