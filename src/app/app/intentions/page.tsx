'use client';

import { HandHeart, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useNotifications } from '@/components/ui/notifications';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { useMyIntentions } from '@/features/intentions/api/get-my-intentions';
import { IntentionsIntro } from '@/features/intentions/components/intentions-intro';
import { MassIntentionCard } from '@/features/intentions/components/mass-intention-card';
import { SubmitIntentionForm } from '@/features/intentions/components/submit-intention-form';

export default function IntentionsPage() {
  const [showForm, setShowForm] = useState(false);
  const { addNotification } = useNotifications();
  const { data, isLoading, isError, refetch } = useMyIntentions();

  useRegisterPageMeta({
    title: 'Intentions de messe',
    subtitle: 'Confier et suivre vos intentions de prière',
  });

  function handleSubmitSuccess() {
    setShowForm(false);
    addNotification({
      type: 'success',
      title: 'Intention transmise',
      message:
        'Votre intention a été transmise à votre paroisse. Vous serez informé de sa prise en charge.',
    });
  }

  return (
    <div className="flex flex-col">
      <ContentContainer className="space-y-5">
        <IntentionsIntro />

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {showForm ? (
            <>
              <X className="size-4" aria-hidden="true" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              Nouvelle intention
            </>
          )}
        </button>

        {showForm && (
          <Card className="p-5">
            <SectionHeader title="Nouvelle intention de messe" as="h2" />
            <SubmitIntentionForm onSuccess={handleSubmitSuccess} />
          </Card>
        )}

        {isLoading && <SkeletonList count={3} />}

        {isError && (
          <ErrorState
            title="Impossible de charger vos intentions"
            description="Une erreur est survenue lors du chargement de vos intentions de messe."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && data && data.results.length === 0 && !showForm && (
          <EmptyState
            icon={<HandHeart aria-hidden="true" />}
            title="Aucune intention pour le moment"
            description="Vous n'avez pas encore confié d'intention de messe. Créez-en une pour la soumettre à votre paroisse."
            action={
              <Button
                variant="gold"
                icon={<Plus className="size-4" aria-hidden="true" />}
                onClick={() => setShowForm(true)}
              >
                Confier une intention
              </Button>
            }
          />
        )}

        {!isLoading &&
          !isError &&
          data &&
          data.results.map((intention) => (
            <MassIntentionCard key={intention.id} intention={intention} />
          ))}
      </ContentContainer>
    </div>
  );
}
