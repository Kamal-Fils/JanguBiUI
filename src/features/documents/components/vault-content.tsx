'use client';

import { useQueries } from '@tanstack/react-query';
import { Archive, Lock, Plus } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { getDocumentRequestQueryOptions } from '../api/get-document';
import { useDocumentRequests } from '../api/get-documents';
import { DocumentRequestDetail } from '../types';

import { VaultCard } from './vault-card';

function VaultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-gold/25 bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Pièce téléchargeable : le document final déposé par la paroisse en priorité,
 * à défaut la dernière pièce jointe disponible.
 *
 * NOTE : duplique volontairement le helper de `tracking-hero.tsx`. La
 * factorisation dans `utils/` demandera de toucher ce fichier, livré par une
 * autre phase — à faire quand les deux chantiers seront fusionnés.
 */
function getFinalAttachmentUrl(
  data: DocumentRequestDetail | undefined,
): string | undefined {
  const downloadable = (data?.attachments ?? []).filter((att) => att.file_url);
  if (downloadable.length === 0) return undefined;
  const final = downloadable.find((att) =>
    att.attachment_type.includes('final'),
  );
  return (final ?? downloadable[downloadable.length - 1]).file_url ?? undefined;
}

/**
 * Coffre-fort numérique : uniquement les demandes abouties
 * (status=document_deposited), rendues en cartes-certificats.
 *
 * L'endpoint liste ne porte pas les pièces jointes : le fichier final est
 * résolu par demande via le détail (même clé de cache que la page de suivi, si
 * bien que « Voir la démarche » devient instantané). Tant qu'une résolution est
 * en cours ou qu'aucun fichier n'est exposé, la carte reste un accès valide au
 * détail — aucun bouton mort. Exposer l'URL du fichier dans la liste
 * (PLAN_documents §6.4) supprimerait ces appels.
 */
export function VaultContent() {
  const { data, isLoading, isError, refetch } = useDocumentRequests({
    status: 'document_deposited',
  });
  const documents = data?.results ?? [];

  const detailQueries = useQueries({
    queries: documents.map((doc) => getDocumentRequestQueryOptions(doc.id)),
  });

  const showList = !isLoading && !isError && documents.length > 0;

  return (
    <section aria-label="Coffre-fort numérique">
      <header className="mb-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-gold/50 bg-accent/15 font-serif text-lg text-gold-ink"
          >
            ✠
          </span>
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Mon coffre-fort
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {showList
                ? `${documents.length} document${documents.length > 1 ? 's' : ''} officiel${documents.length > 1 ? 's' : ''} · conservé${documents.length > 1 ? 's' : ''} à vie`
                : 'Vos documents officiels, conservés à vie'}
            </p>
          </div>
        </div>
        <div className="hairline-gold mt-2.5" aria-hidden="true" />
      </header>

      <p className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
        <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        Accessible uniquement par vous. Chaque document est déposé et signé par
        votre paroisse, et reste conservé à vie.
      </p>

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

      {showList && (
        <div className="flex flex-col gap-3">
          {documents.map((doc, index) => {
            const detail = detailQueries[index];
            return (
              <VaultCard
                key={doc.id}
                document={doc}
                downloadUrl={getFinalAttachmentUrl(detail?.data)}
                isResolvingDownload={detail?.isPending ?? false}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
