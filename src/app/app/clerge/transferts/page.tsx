'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { useAdminTransfers } from '@/features/transfert-paroissial/api/get-admin-transfers';
import { AdminTransferList } from '@/features/transfert-paroissial/components/admin-transfer-list';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

export default function ClergeTransfertsPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const authorized = !userLoading && isClergy(user);
  const { data, isLoading: dataLoading } = useAdminTransfers(authorized);

  useEffect(() => {
    if (!userLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, router]);

  if (userLoading || !isClergy(user)) return null;

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Transferts paroissiaux"
          subtitle="Gérer les demandes de transfert de votre paroisse"
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
          <AdminTransferList
            transfers={data?.results ?? []}
            isLoading={dataLoading}
          />
        </div>
      </div>
    </AppShell>
  );
}
