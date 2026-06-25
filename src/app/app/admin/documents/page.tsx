'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardEyebrow } from '@/components/ui/card/card';
import { FilterPills } from '@/components/ui/filter-pills';
import { useAdminDocuments } from '@/features/documents/api/get-admin-documents';
import { AdminDocumentList } from '@/features/documents/components/admin-document-list';
import { DocumentStatus } from '@/features/documents/types';
import { useUser } from '@/lib/auth';
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
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');

  useEffect(() => {
    if (!isLoading && !canProcessDocuments(user)) {
      router.replace('/app');
    }
  }, [user, isLoading, router]);

  const { data, isLoading: docsLoading } = useAdminDocuments(
    statusFilter ? { status: statusFilter } : undefined,
  );

  if (isLoading || !canProcessDocuments(user)) return null;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Demandes de documents"
        subtitle="Traiter les demandes de documents ecclésiastiques"
      />
        <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
          <div className="mb-5">
            <FilterPills
              options={STATUS_FILTERS.map((f) => ({
                value: f.value,
                label: f.label,
              }))}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as DocumentStatus | '')}
              ariaLabel="Filtrer par statut"
            />
          </div>

          <Card variant="feature">
            <CardContent className="p-4 sm:p-5">
              <CardEyebrow className="mb-3">Demandes à traiter</CardEyebrow>
              <AdminDocumentList
                documents={data?.results ?? []}
                isLoading={docsLoading}
              />
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
