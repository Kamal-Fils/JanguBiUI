'use client';

import { Radio, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
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
          <Radio className="size-4 animate-pulse text-success" />
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
        <Users className="mr-2 size-4" />
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
  const { data: rosaries, isLoading } = useCommunityRosaries();
  const [intention, setIntention] = useState('');
  const { mutate: start, isPending } = useStartCommunityRosary({
    onSuccess: (r) => {
      setIntention('');
      onJoin(r);
    },
  });

  return (
    <div className="space-y-4">
      {isClergy(user) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-sm font-medium text-primary">
            Initier un chapelet communautaire
          </p>
          <Input
            type="text"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Intention de prière (optionnel)"
            className="mb-2"
          />
          <Button
            size="sm"
            onClick={() => start({ intention })}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Démarrage…' : 'Démarrer le chapelet'}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : rosaries?.length === 0 ? (
          <EmptyState
            icon={<Radio />}
            title="Aucun chapelet communautaire"
            description="Aucun chapelet n'est en cours pour le moment."
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
