'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Radio, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-green-500 animate-pulse" />
          <span className="text-sm font-medium">
            {rosary.mystery_group_name ?? 'Chapelet en cours'}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(rosary.started_at), {
            addSuffix: true,
            locale: fr,
          })}
        </span>
      </div>
      {rosary.intention && (
        <p className="mt-2 text-sm text-gray-600 italic">{rosary.intention}</p>
      )}
      <p className="mt-1 text-xs text-gray-400">
        Par {rosary.initiator_email} — Décade {rosary.current_decade}
      </p>
      <Button size="sm" className="mt-3 w-full" onClick={() => onJoin(rosary)}>
        <Users className="mr-2 size-4" />
        Rejoindre
      </Button>
    </div>
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700 mb-2">
            Initier un chapelet communautaire
          </p>
          <input
            type="text"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Intention de prière (optionnel)"
            className="w-full rounded-md border border-blue-300 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))
        ) : rosaries?.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucun chapelet communautaire actif.
          </p>
        ) : (
          rosaries?.map((r) => (
            <RosaryCard key={r.id} rosary={r} onJoin={onJoin} />
          ))
        )}
      </div>
    </div>
  );
}
