'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { useAdminDocumentCounts } from '@/features/documents/api/get-admin-document-counts';
import { useAdminDocuments } from '@/features/documents/api/get-admin-documents';
import { AdminDocumentList } from '@/features/documents/components/admin-document-list';
import {
  QueueCounters,
  type QueueFilterValue,
} from '@/features/documents/components/queue-counters';
import { SignaturePanel } from '@/features/documents/components/signature-panel';
import { canProcessDocuments } from '@/lib/authorization';

/** Aligné sur `default_limit` de la pagination backend. */
const PAGE_SIZE = 20;

export default function AdminDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState<QueueFilterValue>('');
  const [page, setPage] = useState(0);

  const changeFilter = (value: QueueFilterValue) => {
    setStatusFilter(value);
    setPage(0);
  };

  const { data, isLoading, isError, refetch } = useAdminDocuments({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Comptages calculés par le serveur sur TOUT le périmètre d'autorité : ils
  // restent justes quel que soit le filtre ou la page affichée.
  const { data: countsData } = useAdminDocumentCounts();

  // Les demandes prêtes à signer ont leur propre requête : le panneau reste
  // complet même quand la file est paginée, et l'acte du curé n'est jamais
  // relégué en page 2.
  const showSignaturePanel = statusFilter === '' || statusFilter === 'validated';
  const { data: signatureData } = useAdminDocuments(
    showSignaturePanel ? { status: 'validated', limit: 50 } : undefined,
  );
  const awaitingSignature = showSignaturePanel
    ? (signatureData?.results ?? [])
    : [];

  const results = data?.results ?? [];
  // Sans filtre, les demandes à signer sont retirées du tableau : elles sont
  // mises en scène dans le panneau ci-dessus, pas dupliquées en ligne.
  const queueDocuments =
    statusFilter === ''
      ? results.filter((doc) => doc.status !== 'validated')
      : results;

  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showPagination = !isError && totalCount > PAGE_SIZE;
  const firstShown = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastShown = Math.min((page + 1) * PAGE_SIZE, totalCount);

  // Sans filtre, une file vide n'a rien à montrer : on évite d'afficher un état
  // vide trompeur juste sous un panneau de signature rempli.
  const showQueueCard =
    queueDocuments.length > 0 || awaitingSignature.length === 0;

  return (
    <AdminPageLayout
      title="Demandes de documents"
      subtitle="File de traitement paroissiale, priorisée par délai"
      allow={canProcessDocuments}
      // Écran de travail : on prend la largeur disponible pour tenir plus de
      // demandes à l'écran, pas une mesure de lecture confortable.
      width="xl"
      toolbar={
        <QueueCounters
          value={statusFilter}
          onChange={changeFilter}
          counts={countsData?.counts}
          totalCount={countsData?.total}
        />
      }
    >
      {isError ? (
        <ErrorState
          title="Impossible de charger les demandes"
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <SignaturePanel documents={awaitingSignature} />

          {showQueueCard && (
            <section aria-labelledby="queue-title">
              <h2
                id="queue-title"
                className="mb-2 text-sm font-semibold text-foreground"
              >
                File de traitement
              </h2>

              <AdminDocumentList
                documents={queueDocuments}
                isLoading={isLoading}
              />

              {showPagination && (
                <nav
                  aria-label="Pagination de la file"
                  className="mt-3 flex items-center justify-between gap-3"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 md:h-8"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Précédent
                  </Button>
                  {/* Une plage exacte situe mieux qu'un numéro de page : l'agent
                      sait combien de demandes restent derrière lui. */}
                  <span
                    aria-live="polite"
                    className="text-xs tabular-nums text-muted-foreground"
                  >
                    {firstShown}–{lastShown} sur {totalCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 md:h-8"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </nav>
              )}
            </section>
          )}
        </>
      )}
    </AdminPageLayout>
  );
}
