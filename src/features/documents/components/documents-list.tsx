'use client';

import { ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { useDocumentRequests } from '../api/get-documents';
import { DocumentRequest, DocumentStatus } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

import { ActionRequiredCard } from './action-required-card';
import { DocumentStatusBadge } from './document-status-badge';
import { MiniTrack } from './mini-track';
import { VaultTeaserCard } from './vault-teaser-card';

/** Statuts terminaux — tout le reste est « en cours » et reste suivi. */
const DONE_STATUSES: DocumentStatus[] = ['document_deposited', 'rejected'];

const CTA_CLASS =
  'inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none';

function DocumentsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
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

/** Ligne de contexte : paroisse et référence officielle quand elles existent. */
function contextLine(doc: DocumentRequest): string | null {
  const parts = [
    doc.parish_name,
    doc.reference ? `Réf. ${doc.reference}` : null,
  ];
  const meaningful = parts.filter(Boolean);
  return meaningful.length > 0 ? meaningful.join(' · ') : null;
}

/**
 * Carte d'une demande en cours — le cœur du hub de suivi : type, contexte,
 * statut et surtout la mini-timeline qui répond à « où en est ma demande ? »
 * sans avoir à ouvrir le détail.
 */
function TrackCard({ doc }: { doc: DocumentRequest }) {
  const context = contextLine(doc);
  return (
    <Link
      href={paths.app.document.getHref(doc.id)}
      className="group block rounded-2xl border border-primary/15 bg-card p-4 shadow-soft-sm transition-[transform,box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:transform-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-serif text-[15px] font-bold text-foreground transition-colors group-hover:text-primary">
            {formatDocumentType(doc.document_type, doc.document_type_free)}
          </p>
          {context && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {context}
            </p>
          )}
        </div>
        <DocumentStatusBadge status={doc.status} />
      </div>

      <MiniTrack status={doc.status} className="mt-3.5" />

      <p className="mt-2.5 text-[11px] text-muted-foreground">
        Déposée le {formatFrDate(doc.created_at, 'short')}
      </p>
    </Link>
  );
}

/** Demande terminée : plus rien à suivre → ligne compacte, une seule ligne. */
function DoneRow({ doc }: { doc: DocumentRequest }) {
  return (
    <li>
      <Link
        href={paths.app.document.getHref(doc.id)}
        className="group flex items-center gap-3 border-b border-border px-1 py-2.5 last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <DocumentStatusBadge status={doc.status} />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          {formatDocumentType(doc.document_type, doc.document_type_free)}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatFrDate(doc.updated_at ?? doc.created_at, 'short')}
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

interface DocumentsListProps {
  /**
   * Ouvre le coffre-fort (vue locale de la page Documents). Absent → la carte
   * d'accès au coffre-fort n'est pas rendue.
   */
  onOpenVault?: () => void;
}

/**
 * Hub du fidèle : tableau de bord de suivi « colis ». L'action requise remonte
 * en tête, chaque demande en cours porte sa progression, le coffre-fort est un
 * accès permanent (et non plus un onglet), les demandes terminées sont repliées.
 */
export function DocumentsList({ onOpenVault }: DocumentsListProps) {
  const { data, isLoading, isError, refetch } = useDocumentRequests();
  const [showDone, setShowDone] = useState(false);

  const requests = data?.results ?? [];
  const needsAction = requests.filter((doc) => doc.status === 'info_requested');
  const inProgress = requests.filter(
    (doc) => !DONE_STATUSES.includes(doc.status),
  );
  const done = requests.filter((doc) => DONE_STATUSES.includes(doc.status));
  const depositedCount = requests.filter(
    (doc) => doc.status === 'document_deposited',
  ).length;

  return (
    <div className="flex flex-col">
      <SectionHeader
        eyebrow="Le registre"
        title="Vos démarches"
        description="Suivez chaque demande pas à pas, de la soumission au dépôt."
        action={
          <Link href={paths.app.newDocument.getHref()} className={CTA_CLASS}>
            <Plus className="size-4" aria-hidden="true" />
            Nouvelle demande
          </Link>
        }
      />

      {isLoading && <DocumentsSkeleton />}

      {isError && (
        <ErrorState
          title="Impossible de charger vos demandes"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && requests.length === 0 && (
        <EmptyState
          icon={<FileText aria-hidden="true" />}
          title="Demandez votre premier document"
          description="Certificat de baptême, confirmation, mariage… Déposez votre demande en ligne et suivez-la pas à pas jusqu'au dépôt."
          action={
            <Link href={paths.app.newDocument.getHref()} className={CTA_CLASS}>
              <Plus className="size-4" aria-hidden="true" />
              Nouvelle demande
            </Link>
          }
        />
      )}

      {!isLoading && !isError && requests.length > 0 && (
        <div className="flex flex-col gap-6">
          <ActionRequiredCard documents={needsAction} />

          {inProgress.length > 0 && (
            <section aria-label="Demandes en cours">
              <GroupHeading title="En cours" count={inProgress.length} />
              <div className="flex flex-col gap-3">
                {inProgress.map((doc) => (
                  <TrackCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          )}

          {onOpenVault && (
            <VaultTeaserCard count={depositedCount} onOpen={onOpenVault} />
          )}

          {done.length > 0 && (
            <section aria-label="Demandes terminées">
              <button
                type="button"
                onClick={() => setShowDone((open) => !open)}
                aria-expanded={showDone}
                aria-controls="documents-done-panel"
                className="w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-serif text-base font-bold tracking-tight text-foreground">
                    Terminées
                    <ChevronDown
                      className={cn(
                        'size-4 text-muted-foreground transition-transform',
                        showDone && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {done.length} demande{done.length > 1 ? 's' : ''}
                  </span>
                </span>
                <span className="hairline-gold mt-2 block" aria-hidden="true" />
              </button>

              {showDone && (
                <ul id="documents-done-panel" className="mt-1 flex flex-col">
                  {done.map((doc) => (
                    <DoneRow key={doc.id} doc={doc} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
