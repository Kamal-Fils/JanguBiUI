'use client';

import { Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useParishIntentions } from '@/features/intentions/api/get-parish-intentions';
import {
  useAcceptIntention,
  useCelebrateIntention,
  useDeclineIntention,
  useProposeDate,
} from '@/features/intentions/api/manage-intentions';
import { MassIntentionCard } from '@/features/intentions/components/mass-intention-card';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

export default function ClergeIntentionsPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { data, isLoading, isError, refetch } = useParishIntentions();
  const { mutate: accept, isPending: accepting } = useAcceptIntention();
  const { mutate: celebrate, isPending: celebrating } = useCelebrateIntention();
  const { mutate: decline, isPending: declining } = useDeclineIntention();
  const { mutate: proposeDate, isPending: proposingDate } = useProposeDate();
  const [proposingDateFor, setProposingDateFor] = useState<number | null>(null);
  const [dateInput, setDateInput] = useState('');

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
          title="Intentions reçues"
          backHref={paths.app.clerge.root.getHref()}
        />
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
          <SectionHeader
            eyebrow="Intentions de messe"
            title="Les intentions de votre paroisse"
            description="Les fidèles vous confient leurs intentions de prière. Acceptez-les, proposez une date, puis marquez-les célébrées."
          />

          {isLoading && <SkeletonList count={4} />}

          {isError && (
            <ErrorState
              title="Impossible de charger les intentions"
              description="Une erreur est survenue lors du chargement des intentions de votre paroisse."
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && data && data.results.length === 0 && (
            <EmptyState
              icon={<Inbox aria-hidden="true" />}
              title="Aucune intention en attente"
              description="Les intentions de messe soumises par les fidèles de votre paroisse apparaîtront ici."
            />
          )}

          {!isLoading &&
            !isError &&
            data &&
            data.results.map((intention) => (
              <MassIntentionCard
                key={intention.id}
                intention={intention}
                showRequester
              >
                {intention.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => accept(intention.id)}
                      disabled={accepting}
                      isLoading={accepting}
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-gold"
                      onClick={() => decline({ intentionId: intention.id })}
                      disabled={declining}
                      isLoading={declining}
                    >
                      Refuser
                    </Button>
                  </>
                )}
                {(intention.status === 'accepted' ||
                  intention.status === 'date_proposed') && (
                  <>
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => celebrate(intention.id)}
                      disabled={celebrating}
                      isLoading={celebrating}
                    >
                      Marquer célébrée
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-gold"
                      onClick={() => {
                        setProposingDateFor(intention.id);
                        setDateInput('');
                      }}
                    >
                      Proposer une date
                    </Button>
                  </>
                )}

                {proposingDateFor === intention.id && (
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <label
                      htmlFor={`propose-date-${intention.id}`}
                      className="sr-only"
                    >
                      Date proposée
                    </label>
                    <Input
                      id={`propose-date-${intention.id}`}
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="w-auto"
                    />
                    <Button
                      size="sm"
                      variant="gold"
                      disabled={!dateInput || proposingDate}
                      isLoading={proposingDate}
                      onClick={() => {
                        if (dateInput) {
                          proposeDate(
                            {
                              intentionId: intention.id,
                              proposed_date: dateInput,
                            },
                            { onSuccess: () => setProposingDateFor(null) },
                          );
                        }
                      }}
                    >
                      Confirmer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost-indigo"
                      onClick={() => setProposingDateFor(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </MassIntentionCard>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
