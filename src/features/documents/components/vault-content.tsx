'use client';

import { Archive, Download, FileCheck, Plus } from 'lucide-react';
import Link from 'next/link';

import { CardEyebrow } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { formatFrDate } from '@/utils/format-date';

import { useDocumentRequests } from '../api/get-documents';
import { formatDocumentType } from '../utils/format-document-type';

function VaultSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Coffre-fort numérique : uniquement les demandes abouties
 * (status=document_deposited). Chaque carte ouvre le détail de la demande, où
 * le document final se télécharge depuis les pièces jointes.
 */
export function VaultContent() {
  const { data, isLoading, isError, refetch } = useDocumentRequests({
    status: 'document_deposited',
  });
  const documents = data?.results ?? [];

  return (
    <section aria-label="Coffre-fort numérique">
      <SectionHeader
        eyebrow="Le coffre-fort"
        title="Vos documents délivrés"
        description="Chaque document déposé par votre paroisse est conservé ici, en sécurité et téléchargeable à tout moment."
      />

      {isLoading && <VaultSkeleton />}

      {isError && (
        <ErrorState
          title="Impossible de charger vos documents"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <EmptyState
          icon={<Archive aria-hidden="true" />}
          title="Votre coffre-fort est prêt"
          description="Dès qu'un document officiel est délivré par votre paroisse, il est déposé ici et reste accessible à vie. Commencez par déposer une demande."
          action={
            <Link
              href={paths.app.newDocument.getHref()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none"
            >
              <Plus className="size-4" aria-hidden="true" />
              Faire une demande
            </Link>
          }
        />
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={paths.app.document.getHref(doc.id)}
              className="group flex flex-col gap-3 rounded-2xl border border-primary/15 bg-secondary/60 p-4 shadow-soft-sm transition-[transform,box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-soft active:scale-[0.99] motion-reduce:transform-none"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 ring-1 ring-inset ring-success/15">
                  <FileCheck
                    className="size-5 text-success"
                    aria-hidden="true"
                  />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  <Download className="size-3" aria-hidden="true" />
                  Disponible
                </span>
              </div>

              <div className="flex-1">
                <CardEyebrow className="text-gold-ink">
                  Document officiel
                </CardEyebrow>
                <p className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {formatDocumentType(doc.document_type)}
                </p>
                {doc.parish_name && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {doc.parish_name}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Délivré le {formatFrDate(doc.updated_at ?? doc.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
