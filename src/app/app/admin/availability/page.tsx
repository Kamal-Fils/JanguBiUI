'use client';

import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="size-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Bientôt disponible
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            La gestion des disponibilités est en cours de développement. Cette
            fonctionnalité sera disponible prochainement.
          </p>
        </div>
      </div>
    </div>
  );
}
