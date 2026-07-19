'use client';

import { HandHeart, Plus } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useMyIntentions } from '@/features/intentions/api/get-my-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';

/** Trois suffit : le reste vit sur la page Intentions, à un tap. */
const HOME_INTENTIONS_COUNT = 3;

export function MyIntentionsSection() {
  const { data, isLoading, isError, refetch } = useMyIntentions();

  const recentIntentions = (data?.results ?? []).slice(
    0,
    HOME_INTENTIONS_COUNT,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Intentions indisponibles"
        description="Vos intentions n’ont pas pu être chargées."
        onRetry={() => void refetch()}
        className="py-8"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {recentIntentions.length === 0 ? (
        <EmptyState
          icon={<HandHeart />}
          title="Aucune intention déposée"
          description="Confiez une intention à votre paroisse : elle sera portée à la messe."
          className="py-8"
        />
      ) : (
        recentIntentions.map((intention) => (
          <Card
            key={intention.id}
            variant="elevated"
            className="flex items-start justify-between gap-3 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-foreground">
                {intention.intention_text}
              </p>
              {intention.proposed_date && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Date proposée :{' '}
                  {new Date(intention.proposed_date).toLocaleDateString(
                    'fr-FR',
                    {
                      day: 'numeric',
                      month: 'long',
                    },
                  )}
                </p>
              )}
            </div>
            <IntentionStatusBadge status={intention.status} />
          </Card>
        ))
      )}

      <Link
        href={paths.app.intentions.getHref()}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <Plus className="size-4" aria-hidden="true" />
        Déposer une intention
      </Link>
    </div>
  );
}
