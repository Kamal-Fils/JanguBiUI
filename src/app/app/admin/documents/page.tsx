'use client';

import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Card, CardContent, CardEyebrow } from '@/components/ui/card/card';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { useAdminDocuments } from '@/features/documents/api/get-admin-documents';
import { AdminDocumentList } from '@/features/documents/components/admin-document-list';
import { DocumentStatus } from '@/features/documents/types';
import { canProcessDocuments } from '@/lib/authorization';

const STATUS_FILTERS: { label: string; value: DocumentStatus | '' }[] = [
  { label: 'Toutes', value: '' },
  { label: 'Soumises', value: 'submitted' },
  { label: 'En vérification', value: 'under_verification' },
  { label: 'Info demandée', value: 'info_requested' },
  { label: 'Validées', value: 'validated' },
  { label: 'Déposées', value: 'document_deposited' },
  { label: 'Rejetées', value: 'rejected' },
];

export default function AdminDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');

  const { data, isLoading, isError, refetch } = useAdminDocuments(
    statusFilter ? { status: statusFilter } : undefined,
  );

  return (
    <AdminPageLayout
      title="Demandes de documents"
      subtitle="Traiter les demandes de documents ecclésiastiques"
      allow={canProcessDocuments}
      width="lg"
      toolbar={
        <FilterPills
          options={STATUS_FILTERS.map((f) => ({
            value: f.value,
            label: f.label,
          }))}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as DocumentStatus | '')}
          ariaLabel="Filtrer par statut"
        />
      }
    >
      <Card variant="feature">
        <CardContent className="p-4 sm:p-5">
          <CardEyebrow className="mb-3">Demandes à traiter</CardEyebrow>
          {isError ? (
            <ErrorState
              title="Impossible de charger les demandes"
              onRetry={() => refetch()}
            />
          ) : (
            <AdminDocumentList
              documents={data?.results ?? []}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
