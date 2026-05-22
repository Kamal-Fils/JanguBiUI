'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { usePendingClergy } from '@/features/users/api/get-pending-clergy';
import { PendingClergyList } from '@/features/users/components/pending-clergy-list';
import { useUser } from '@/lib/auth';
import { canManageClergy } from '@/lib/authorization';

export default function ClergyValidationPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const authorized = !userLoading && canManageClergy(user);

  const { data, isLoading: dataLoading } = usePendingClergy(authorized);

  useEffect(() => {
    if (!userLoading && !canManageClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, router]);

  if (userLoading || !authorized) return null;

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Validation des comptes clergé"
          subtitle="Approuver ou refuser les comptes en attente de validation hiérarchique"
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
          <PendingClergyList
            accounts={data?.results ?? []}
            totalCount={data?.count ?? 0}
            isLoading={dataLoading}
          />
        </div>
      </div>
    </AppShell>
  );
}
