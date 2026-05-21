'use client';

import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { useCreateConversation } from '../api/create-conversation';
import { usePriests, Priest } from '../api/get-priests';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function PriestsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PriestRow({
  priest,
  onSelect,
}: {
  priest: Priest;
  onSelect: (priest: Priest) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(priest)}
      disabled={!priest.accepts_pastoral_chat}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Avatar className="size-11 shrink-0">
        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
          {getInitials(priest.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">
          {priest.full_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{priest.email}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          priest.accepts_pastoral_chat
            ? 'bg-success/10 text-success'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {priest.accepts_pastoral_chat ? 'Disponible' : 'Indisponible'}
      </span>
    </button>
  );
}

export function NewConversation() {
  const router = useRouter();
  const { data: priests, isLoading, isError } = usePriests();
  const { mutate: createConversation, isPending } = useCreateConversation({
    onSuccess: (conv) => {
      router.push(`/app/messages/${conv.id}`);
    },
  });

  function handleSelect(priest: Priest) {
    if (!priest.accepts_pastoral_chat || isPending) return;
    createConversation({ priest_user_id: priest.user_id });
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <span className="text-sm font-semibold text-foreground">
            Nouvelle conversation
          </span>
          <p className="text-xs text-muted-foreground">Choisissez un prêtre</p>
        </div>
        {isPending && (
          <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isLoading && <PriestsSkeleton />}

      {isError && (
        <p className="py-10 text-center text-sm text-destructive">
          Impossible de charger la liste des prêtres.
        </p>
      )}

      {!isLoading && !isError && !priests?.length && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageCircle className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucun prêtre disponible pour le moment.
          </p>
        </div>
      )}

      {!isLoading && !isError && !!priests?.length && (
        <div className="flex flex-col divide-y divide-border">
          {priests.map((priest) => (
            <PriestRow
              key={priest.id}
              priest={priest}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
