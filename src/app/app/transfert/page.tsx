'use client';

import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useNotifications } from '@/components/ui/notifications';
import { SkeletonCard } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMyTransfer } from '@/features/transfert-paroissial/api/get-my-transfer';
import { TransferRequestForm } from '@/features/transfert-paroissial/components/transfer-request-form';
import { TransferStatusCard } from '@/features/transfert-paroissial/components/transfer-status-card';

export default function TransfertPage() {
  const { addNotification } = useNotifications();
  const { data: transfer, isLoading, isError, refetch } = useMyTransfer();

  function handleTransferSuccess() {
    addNotification({
      type: 'success',
      title: 'Demande envoyée',
      message: 'Votre demande de transfert a bien été soumise.',
    });
  }

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Transfert paroissial"
          subtitle="Demander un rattachement à une nouvelle paroisse"
          action={
            <Link
              href={paths.app.profil.getHref()}
              className="flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Profil
            </Link>
          }
        />

        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6">
          {isLoading ? (
            <SkeletonCard />
          ) : isError ? (
            <ErrorState
              title="Impossible de charger votre demande"
              description="Une erreur est survenue lors de la récupération de votre transfert."
              onRetry={() => refetch()}
            />
          ) : transfer ? (
            <div className="space-y-6">
              <TransferStatusCard transfer={transfer} />
              {transfer.status === 'rejected' && (
                <div className="space-y-4">
                  <h2 className="font-serif text-lg font-bold tracking-tight text-foreground">
                    Soumettre une nouvelle demande
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Votre demande a été refusée. Vous pouvez en soumettre une
                    nouvelle ci-dessous.
                  </p>
                  <TransferRequestForm onSuccess={handleTransferSuccess} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <EmptyState
                icon={<ArrowRightLeft aria-hidden="true" />}
                title="Aucune demande en cours"
                description="Sélectionnez votre nouvelle paroisse et soumettez votre demande de transfert ci-dessous."
              />
              <TransferRequestForm onSuccess={handleTransferSuccess} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
