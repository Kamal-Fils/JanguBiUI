'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { usePendingClergy } from '@/features/users/api/get-pending-clergy';
import { PendingClergyList } from '@/features/users/components/pending-clergy-list';
import { useUser } from '@/lib/auth';
import { canManageClergy } from '@/lib/authorization';

export default function ClergyValidationPage() {
  const { data: user } = useUser();
  const authorized = canManageClergy(user);

  const { data, isLoading } = usePendingClergy(authorized);

  return (
    <AdminPageLayout
      title="Validation des comptes clergé"
      subtitle="Approuver ou refuser les comptes en attente de validation hiérarchique"
      allow={canManageClergy}
      width="lg"
    >
      <PendingClergyList
        accounts={data?.results ?? []}
        totalCount={data?.count ?? 0}
        isLoading={isLoading}
      />
    </AdminPageLayout>
  );
}
