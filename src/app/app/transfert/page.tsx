'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyTransfer } from '@/features/transfert-paroissial/api/get-my-transfer';
import { TransferRequestForm } from '@/features/transfert-paroissial/components/transfer-request-form';
import { TransferStatusCard } from '@/features/transfert-paroissial/components/transfer-status-card';
import { paths } from '@/config/paths';

export default function TransfertPage() {
  const { data: transfer, isLoading } = useMyTransfer();

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Transfert paroissial"
          subtitle="Demander un rattachement à une nouvelle paroisse"
          action={
            <Link
              href={paths.app.profil.getHref()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Profil
            </Link>
          }
        />

        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : transfer ? (
            <div className="space-y-6">
              <TransferStatusCard transfer={transfer} />
              {transfer.status === 'rejected' && (
                <div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Votre demande a été refusée. Vous pouvez en soumettre une nouvelle.
                  </p>
                  <TransferRequestForm onSuccess={() => {}} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez aucune demande de transfert en cours. Sélectionnez
                votre nouvelle paroisse et soumettez votre demande ci-dessous.
              </p>
              <TransferRequestForm onSuccess={() => {}} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
