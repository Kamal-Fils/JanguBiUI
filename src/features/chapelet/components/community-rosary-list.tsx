'use client';

import { Radio, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { RelativeTime } from '@/components/ui/relative-time';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

import type { CommunityRosary } from '../api/get-community-rosaries';
import { useCommunityRosaries } from '../api/get-community-rosaries';
import { useStartCommunityRosary } from '../api/start-community-rosary';

function RosaryCard({
  rosary,
  onJoin,
}: {
  rosary: CommunityRosary;
  onJoin: (r: CommunityRosary) => void;
}) {
  return (
    <Card variant="elevated" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio
            className="size-4 animate-pulse text-success motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-foreground">
            {rosary.mystery_group_name ?? 'Chapelet en cours'}
          </span>
        </div>
        <RelativeTime
          iso={rosary.started_at}
          className="text-xs text-muted-foreground"
        />
      </div>
      {rosary.intention && (
        <p className="mt-2 text-sm italic text-muted-foreground">
          {rosary.intention}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        Par {rosary.initiator_email} — Décade {rosary.current_decade}
      </p>
      <Button size="sm" className="mt-3 w-full" onClick={() => onJoin(rosary)}>
        <Users className="mr-2 size-4" aria-hidden="true" />
        Rejoindre
      </Button>
    </Card>
  );
}

interface CommunityRosaryListProps {
  onJoin: (rosary: CommunityRosary) => void;
}

export function CommunityRosaryList({ onJoin }: CommunityRosaryListProps) {
  const { data: user } = useUser();
  const {
    data: rosaries,
    isLoading,
    isError,
    refetch,
  } = useCommunityRosaries();
  const [intention, setIntention] = useState('');
  const {
    mutate: start,
    isPending,
    isError: isStartError,
  } = useStartCommunityRosary({
    onSuccess: (r) => {
      setIntention('');
      onJoin(r);
    },
  });

  return (
    <div className="space-y-4">
      {/* Initier — réservé au clergé et aux religieux (garde RBAC) */}
      {isClergy(user) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-sm font-medium text-primary">
            Initier un chapelet communautaire
          </p>
          <label
            htmlFor="rosary-intention"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Intention de prière (optionnel)
          </label>
          <Input
            id="rosary-intention"
            type="text"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Ex. Pour les malades de la paroisse"
            className="mb-2"
          />
          <Button
            size="sm"
            onClick={() => start({ intention: intention.trim() })}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Démarrage…' : 'Démarrer le chapelet'}
          </Button>
          {isStartError && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              Impossible de démarrer le chapelet. Veuillez réessayer.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : isError ? (
          <ErrorState
            title="Impossible de charger les chapelets"
            description="Le chargement des chapelets communautaires a échoué."
            onRetry={() => refetch()}
          />
        ) : rosaries?.length === 0 ? (
          <EmptyState
            icon={<Radio aria-hidden="true" />}
            title="Aucun chapelet en cours"
            description="Le chapelet communautaire permet de prier ensemble, au même moment, autour d'une même intention. Dès qu'un prêtre ou un religieux lance un chapelet, il apparaîtra ici — revenez un peu plus tard."
          />
        ) : (
          rosaries?.map((r) => (
            <RosaryCard key={r.id} rosary={r} onJoin={onJoin} />
          ))
        )}
      </div>
    </div>
  );
}
