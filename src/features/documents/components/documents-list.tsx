'use client';

import { ChevronRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layouts/page-header';
import { CardEyebrow } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import { useDocumentRequests } from '../api/get-documents';
import { DocumentRequest, DocumentStatus } from '../types';
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

/** Statuts terminaux — tout le reste est « en cours ». */
const DONE_STATUSES: DocumentStatus[] = ['document_deposited', 'rejected'];

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

/** Intertitre de groupe : titre serif + compteur + filet or. */
function GroupHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-base font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {count} demande{count > 1 ? 's' : ''}
        </span>
      </div>
      <div className="hairline-gold mt-2" aria-hidden="true" />
    </div>
  );
}

/** Carte de demande — style « suivi de courrier » : liseré, type, badge. */
function RequestCard({ doc }: { doc: DocumentRequest }) {
  return (
    <Link
      href={paths.app.document.getHref(String(doc.id))}
      className="group flex overflow-hidden rounded-2xl border border-primary/15 bg-secondary/60 shadow-soft-sm transition-[transform,box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-soft active:scale-[0.99] motion-reduce:transform-none"
    >
      <div
        className={cn(
          'w-1 shrink-0 transition-all group-hover:w-1.5',
          statusStripe[doc.status],
        )}
      />
      <div className="flex min-w-0 flex-1 items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/15">
          <FileText className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <CardEyebrow className="text-gold-ink">Document officiel</CardEyebrow>
          <p className="mt-0.5 truncate font-serif font-semibold text-foreground transition-colors group-hover:text-primary">
            {formatDocumentType(doc.document_type)}
          </p>
          <p className="text-xs text-muted-foreground">
            Déposée le {formatDate(doc.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <DocumentStatusBadge status={doc.status} />
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

interface DocumentsListProps {
  hideHeader?: boolean;
}

export function DocumentsList({ hideHeader = false }: DocumentsListProps) {
  const { data, isLoading, isError, refetch } = useDocumentRequests();

  const requests = data?.results ?? [];
  const inProgress = requests.filter(
    (doc) => !DONE_STATUSES.includes(doc.status),
  );
  const done = requests.filter((doc) => DONE_STATUSES.includes(doc.status));

  return (
    <div className="relative flex flex-col">
      {!hideHeader && (
        <PageHeader
          title="Documents"
          subtitle="Demandes de documents officiels"
          action={
            <Link
              href={paths.app.newDocument.getHref()}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-sm hover:bg-primary/90"
              aria-label="Nouvelle demande"
            >
              <Plus className="size-5" />
            </Link>
          }
        />
      )}

      <div
        className={cn(
          'mx-auto w-full',
          !hideHeader && 'max-w-2xl p-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8',
        )}
      >
        <SectionHeader
          eyebrow="Le registre"
          title="Vos démarches"
          description="Suivez chaque demande pas à pas, de la soumission au dépôt."
        />

        {isLoading && <DocumentsSkeleton />}
        {isError && (
          <ErrorState
            title="Impossible de charger vos demandes"
            onRetry={() => refetch()}
          />
        )}
        {!isLoading && !isError && !requests.length && (
          <EmptyState
            icon={<FileText />}
            title="Demandez votre premier document"
            description="Certificat de baptême, confirmation, mariage… Déposez votre demande en ligne et suivez-la pas à pas jusqu'au dépôt."
            action={
              <Link
                href={paths.app.newDocument.getHref()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none"
              >
                <Plus className="size-4" />
                Nouvelle demande
              </Link>
            }
          />
        )}
        {!isLoading && !isError && requests.length > 0 && (
          <div className="flex flex-col gap-7">
            {inProgress.length > 0 && (
              <section aria-label="Demandes en cours">
                <GroupHeading title="En cours" count={inProgress.length} />
                <div className="flex flex-col gap-3">
                  {inProgress.map((doc) => (
                    <RequestCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section aria-label="Demandes terminées">
                <GroupHeading title="Terminées" count={done.length} />
                <div className="flex flex-col gap-3">
                  {done.map((doc) => (
                    <RequestCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
