'use client';

import { HandHeart, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMyIntentions } from '@/features/intentions/api/get-my-intentions';
import { IntentionsIntro } from '@/features/intentions/components/intentions-intro';
import { MassIntentionCard } from '@/features/intentions/components/mass-intention-card';
import { SubmitIntentionForm } from '@/features/intentions/components/submit-intention-form';

export default function IntentionsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useMyIntentions();

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader title="Intentions de Messe" backHref={paths.app.root.getHref()} />
        <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
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
              <SubmitIntentionForm onSuccess={() => setShowForm(false)} />
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
            />
          )}

          {!isLoading &&
            !isError &&
            data &&
            data.results.map((intention) => (
              <MassIntentionCard key={intention.id} intention={intention} />
            ))}
        </div>
      </div>
    </AppShell>
  );
}
