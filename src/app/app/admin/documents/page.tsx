'use client';

import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Card, CardContent, CardEyebrow } from '@/components/ui/card/card';
import { ErrorState } from '@/components/ui/error-state';
import { useAdminDocuments } from '@/features/documents/api/get-admin-documents';
import { AdminDocumentList } from '@/features/documents/components/admin-document-list';
import {
  countQueueBuckets,
  QueueCounters,
  type QueueFilterValue,
} from '@/features/documents/components/queue-counters';
import { SignaturePanel } from '@/features/documents/components/signature-panel';
import { canProcessDocuments } from '@/lib/authorization';

export default function AdminDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState<QueueFilterValue>('');

  const { data, isLoading, isError, refetch } = useAdminDocuments(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const documents = data?.results ?? [];

  // Les demandes prêtes à signer sortent de la file : elles sont mises en
  // scène dans le panneau de signature (acte du curé) plutôt que noyées
  // dans une ligne de tableau.
  const awaitingSignature = documents.filter(
    (doc) => doc.status === 'validated',
  );
  const queueDocuments = documents.filter((doc) => doc.status !== 'validated');

  // L'API est paginée et n'expose aucun total par statut (PLAN_documents §6.3).
  // On ne compte donc QUE sur la page chargée, et uniquement quand aucun filtre
  // serveur n'est actif — sinon les autres étapes afficheraient un « 0 » qui
  // signifierait « inconnu », pas « aucune ».
  const counts =
    statusFilter === '' && !isLoading
      ? countQueueBuckets(documents)
      : undefined;

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
          onChange={setStatusFilter}
          counts={counts}
          loadedCount={documents.length}
          totalCount={data?.count}
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </AdminPageLayout>
  );
}
