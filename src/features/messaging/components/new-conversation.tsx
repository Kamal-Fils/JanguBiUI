'use client';

import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

import { useCreateConversation } from '../api/create-conversation';
import { usePriests, Priest } from '../api/get-priests';

function PriestsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border/50">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
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
      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/60 active:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      <UserAvatar
        name={priest.full_name}
        size="md"
        className="size-11 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[15px] font-semibold text-foreground">
          {priest.full_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{priest.email}</p>
      </div>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none',
          priest.accepts_pastoral_chat
            ? 'bg-success/10 text-success'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <span
          className={cn(
            'size-1.5 rounded-full',
            priest.accepts_pastoral_chat
              ? 'bg-success'
              : 'bg-muted-foreground/50',
          )}
          aria-hidden="true"
        />
        {priest.accepts_pastoral_chat ? 'Disponible' : 'Indisponible'}
      </span>
    </button>
  );
}

export function NewConversation() {
  const router = useRouter();
  const { data: priests, isLoading, isError, refetch } = usePriests();
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
      <div className="sticky top-0 z-10 bg-background-surface/90 backdrop-blur-md">
        <div className="relative flex items-center gap-3 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-muted"
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0">
            {/* 12 px pleine opacité : à 10 px atténué, ce surtitre était
                illisible en plein soleil (DIRECTION.md R3). */}
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Nouvelle conversation
            </p>
            <h1 className="truncate font-serif text-lg font-bold tracking-tight text-foreground">
              Écrire à un prêtre
            </h1>
          </div>
          {isPending && (
            <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground motion-reduce:animate-none" />
          )}
          {/* Filet bleu sous l'en-tête : le bleu porte l'identité, l'or reste
              un accent (DIRECTION.md R4). */}
          <div
            className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      <p className="px-4 pb-1 pt-4 text-sm text-muted-foreground">
        Choisissez un prêtre disponible pour engager un échange confidentiel.
      </p>

      {isLoading && <PriestsSkeleton />}

      {isError && (
        <div className="p-4">
          <ErrorState
            title="Impossible de charger la liste des prêtres"
            description="Vérifiez votre connexion puis réessayez."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {!isLoading && !isError && !priests?.length && (
        <div className="px-4 py-8">
          <EmptyState
            icon={<MessageCircle aria-hidden="true" />}
            title="Aucun prêtre disponible pour le moment"
            description="Revenez un peu plus tard : les prêtres de votre paroisse apparaîtront ici dès qu'ils seront à l'écoute."
          />
        </div>
      )}

      {!isLoading && !isError && !!priests?.length && (
        <div className="flex flex-col divide-y divide-border/50">
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
