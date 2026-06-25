'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { useMyIntentions } from '@/features/intentions/api/get-my-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';

export function MyIntentionsSection() {
  const { data, isLoading } = useMyIntentions();

  const recentIntentions = (data?.results ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && recentIntentions.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted-foreground">
          Vous n&apos;avez pas encore déposé d&apos;intention.
        </p>
      )}

      {!isLoading && recentIntentions.map((intention) => (
        <div
          key={intention.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm text-foreground">
              {intention.intention_text}
            </p>
            {intention.proposed_date && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Date proposée :{' '}
                {new Date(intention.proposed_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            )}
          </div>
          <IntentionStatusBadge status={intention.status} />
        </div>
      ))}

      <Link
        href="/app/intentions"
        className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <Plus className="size-4" />
        Déposer une intention
      </Link>
    </div>
  );
}
