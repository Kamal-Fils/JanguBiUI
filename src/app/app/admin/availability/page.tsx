'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <div className="flex flex-col h-full bg-background-surface">
      <PageHeader
        title="Disponibilités"
        subtitle="Gestion des paroisses, services et ministres"
      />
      <div className="flex-1 p-4">
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
  );
}
