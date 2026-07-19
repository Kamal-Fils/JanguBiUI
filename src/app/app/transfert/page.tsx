'use client';

import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useNotifications } from '@/components/ui/notifications';
import { SectionHeader } from '@/components/ui/section-header';
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

  useRegisterPageMeta({
    title: 'Transfert paroissial',
    subtitle: 'Demander un rattachement à une nouvelle paroisse',
  });

  return (
    <div className="flex flex-col">
      <ContentContainer>
        <div className="mb-4">
          {/* min-h-11 : cible tactile ≥ 44px (DIRECTION.md R3). */}
          <Link
            href={paths.app.profil.getHref()}
            className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Retour au profil
          </Link>
        </div>
        {isLoading ? (
          <SkeletonCard />
        ) : isError ? (
          <ErrorState
            title="Impossible de charger votre demande"
            description="Une erreur est survenue lors de la récupération de votre transfert."
            onRetry={() => refetch()}
          />
        ) : transfer ? (
          // Cadre de page standard ; la colonne de saisie reste étroite.
          <div className="max-w-2xl space-y-6">
            <TransferStatusCard transfer={transfer} />
            {transfer.status === 'rejected' && (
              <section aria-label="Soumettre une nouvelle demande">
                <SectionHeader
                  title="Soumettre une nouvelle demande"
                  description="Votre demande a été refusée. Vous pouvez en soumettre une nouvelle ci-dessous."
                />
                <TransferRequestForm onSuccess={handleTransferSuccess} />
              </section>
            )}
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            <EmptyState
              icon={<ArrowRightLeft aria-hidden="true" />}
              title="Aucune demande en cours"
              description="Sélectionnez votre nouvelle paroisse et soumettez votre demande de transfert ci-dessous."
            />
            <section aria-label="Nouvelle demande de transfert">
              <SectionHeader
                title="Nouvelle demande"
                description="Votre demande sera examinée par votre paroisse actuelle, puis confirmée par la paroisse d'accueil."
              />
              <TransferRequestForm onSuccess={handleTransferSuccess} />
            </section>
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
