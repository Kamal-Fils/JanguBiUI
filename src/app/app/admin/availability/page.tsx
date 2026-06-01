'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { env } from '@/config/env';
import { AdminMinisters } from '@/features/allo-pretre/components/admin-ministers';
import { AdminParishes } from '@/features/allo-pretre/components/admin-parishes';
import { AdminServices } from '@/features/allo-pretre/components/admin-services';
import { useUser } from '@/lib/auth';
import { isAdmin } from '@/lib/authorization';

export default function AvailabilityAdminPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !isAdmin(user)) {
      router.replace('/app');
    }
  }, [user, isLoading, router]);

  if (isLoading || !isAdmin(user)) {
    return null;
  }

  // Backend Availability supprimé : l'admin n'est exposé que sous MSW tant que
  // l'API n'est pas reconstruite en HackSoft (cf. ticket Lot 2/3).
  if (!env.ENABLE_API_MOCKING) {
    return (
      <AppShell>
        <PageHeader
          title="Allo-Prêtre"
          subtitle="Fonctionnalité en cours de préparation."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Allo-Prêtre"
          subtitle="Gestion des paroisses, services et ministres"
        />
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
          <Tabs defaultValue="parishes">
            <TabsList className="mb-4">
              <TabsTrigger value="parishes">Paroisses</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="ministers">Ministres</TabsTrigger>
            </TabsList>
            <TabsContent value="parishes">
              <AdminParishes />
            </TabsContent>
            <TabsContent value="services">
              <AdminServices />
            </TabsContent>
            <TabsContent value="ministers">
              <AdminMinisters />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
