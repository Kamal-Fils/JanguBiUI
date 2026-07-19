'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardEyebrow } from '@/components/ui/card/card';
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

  // Sans filtre, une file vide n'a rien à montrer : on évite d'afficher un état
  // vide trompeur juste sous un panneau de signature rempli.
  const showQueueCard =
    queueDocuments.length > 0 || awaitingSignature.length === 0;

  return (
    <AdminPageLayout
      title="Demandes de documents"
      subtitle="File de traitement paroissiale, priorisée par délai"
      allow={canProcessDocuments}
      width="lg"
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
        <Card variant="feature">
          <CardContent className="p-4 sm:p-5">
            <ErrorState
              title="Impossible de charger les demandes"
              onRetry={() => refetch()}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <SignaturePanel documents={awaitingSignature} />

          {showQueueCard && (
            <Card variant="feature">
              <CardContent className="p-4 sm:p-5">
                <CardEyebrow className="mb-3">Par ordre d’urgence</CardEyebrow>
                <AdminDocumentList
                  documents={queueDocuments}
                  isLoading={isLoading}
                />

                {showPagination && (
                  <nav
                    aria-label="Pagination de la file"
                    className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                      Précédent
                    </Button>
                    <span
                      aria-live="polite"
                      className="text-xs text-muted-foreground"
                    >
                      Page {page + 1} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Suivant
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                  </nav>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </AdminPageLayout>
  );
}
