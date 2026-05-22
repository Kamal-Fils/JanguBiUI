'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { useParishIntentions } from '@/features/intentions/api/get-parish-intentions';
import {
  useAcceptIntention,
  useCelebrateIntention,
  useDeclineIntention,
  useProposeDate,
} from '@/features/intentions/api/manage-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

export default function ClergeIntentionsPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { data, isLoading } = useParishIntentions();
  const { mutate: accept, isPending: accepting } = useAcceptIntention();
  const { mutate: celebrate, isPending: celebrating } = useCelebrateIntention();
  const { mutate: decline, isPending: declining } = useDeclineIntention();
  const { mutate: proposeDate } = useProposeDate();
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
      <PageHeader title="Intentions reçues" />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <p className="text-sm text-gray-500 text-center py-6">Chargement…</p>
        )}

        {data && data.results.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucune intention en attente.
          </p>
        )}

        {data &&
          data.results.map((intention) => (
            <div
              key={intention.id}
              className="rounded-lg border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-800">
                    {intention.intention_text}
                  </p>
                  <p className="text-xs text-gray-500">
                    De : {intention.requestor_email}
                  </p>
                  {intention.parish_name && (
                    <p className="text-xs text-gray-500">
                      Paroisse : {intention.parish_name}
                    </p>
                  )}
                </div>
                <IntentionStatusBadge status={intention.status} />
              </div>

              <div className="flex flex-wrap gap-2">
                {intention.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => accept(intention.id)}
                      disabled={accepting}
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decline({ intentionId: intention.id })}
                      disabled={declining}
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
                      onClick={() => celebrate(intention.id)}
                      disabled={celebrating}
                    >
                      Marquer célébrée
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setProposingDateFor(intention.id);
                        setDateInput('');
                      }}
                    >
                      Proposer une date
                    </Button>
                  </>
                )}
              </div>

              {proposingDateFor === intention.id && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <Button
                    size="sm"
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
                  <button
                    className="text-xs text-gray-400 underline"
                    onClick={() => setProposingDateFor(null)}
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
    </AppShell>
  );
}
