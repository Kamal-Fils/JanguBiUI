'use client';

import { MessageCircle, Search, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useMessagingStore } from '@/stores/messaging-store';

import { useConversations } from '../api/get-conversations';
import type { Conversation } from '../types';

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  if (diffDays === 1) return 'hier';
  if (diffDays < 7)
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getParticipantName(conv: Conversation, currentUserId: string): string {
  const other =
    conv.participant_a.id === currentUserId
      ? conv.participant_b
      : conv.participant_a;
  return other.full_name?.trim() || other.email;
}

function ConversationsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border/50">
      {Array.from({ length: 5 }).map((_, i) => (
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

export function ConversationList() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useConversations(
    search.trim() || undefined,
  );
  const { data: user } = useUser();
  const setTotalUnread = useMessagingStore((s) => s.setTotalUnread);

  useEffect(() => {
    if (!data) return;
    const total = data.results.reduce(
      (sum, c) => sum + (c.unread_count ?? 0),
      0,
    );
    setTotalUnread(total);
  }, [data, setTotalUnread]);

  const currentUserId = user?.id ?? '';

  return (
    <div className="flex flex-col">
      {/* En-tête custom (vue messagerie exemptée du shell header — plein écran).
          Pas de cloche ici : la cloche flottante (routes !meta) la sert déjà.
          Titre + recherche vivent dans le MÊME bloc sticky (un seul offset). */}
      <header className="sticky top-0 z-40 bg-background-surface/90 backdrop-blur-md">
        <div className="relative px-4 pb-3 pt-3.5">
          <div className="flex items-center justify-between gap-3 pr-12 md:pr-0">
            <div className="min-w-0">
              {/* 12 px pleine opacité : à 10 px atténué, ce surtitre était
                  illisible sur un téléphone en plein soleil (DIRECTION.md R3). */}
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Messagerie sécurisée
              </p>
              <h1 className="truncate font-serif text-xl font-bold tracking-tight text-foreground">
                Messages
              </h1>
            </div>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              aria-label="Nouvelle conversation"
            >
              <Link href="/app/messages/new">
                <SquarePen className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher une conversation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-transparent bg-muted/50 py-2 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:bg-muted/70 focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filet bleu sous l'en-tête : le bleu porte l'identité, l'or reste
              un accent (DIRECTION.md R4). */}
          <div
            className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
            aria-hidden="true"
          />
        </div>
      </header>

      {isLoading && <ConversationsSkeleton />}
      {isError && (
        <div className="p-4">
          <ErrorState
            title="Impossible de charger vos messages"
            description="Vérifiez votre connexion puis réessayez."
            onRetry={() => refetch()}
          />
        </div>
      )}
      {!isLoading && !isError && !data?.results.length && (
        <div className="px-4 py-8">
          <EmptyState
            icon={<MessageCircle aria-hidden="true" />}
            title="Aucune conversation pour le moment"
            description="Besoin d'un conseil, d'une prière ou d'une écoute ? Un prêtre est disponible pour un échange confidentiel."
            action={
              <Button asChild>
                <Link href="/app/messages/new">
                  <SquarePen className="size-4" aria-hidden="true" />
                  Écrire à un prêtre
                </Link>
              </Button>
            }
          />
        </div>
      )}
      {!isLoading && !isError && !!data?.results.length && (
        <div className="flex flex-col divide-y divide-border/50">
          {data.results.map((conv) => {
            const participantName = getParticipantName(conv, currentUserId);
            const hasActivity =
              conv.last_message_at != null || conv.unread_count > 0;
            const lastContent =
              conv.last_message?.content ??
              (hasActivity ? '...' : 'Aucun message');
            const lastAt = conv.last_message?.sent_at ?? conv.last_message_at;
            const isUnread = conv.unread_count > 0;

            return (
              <Link
                key={conv.id}
                href={`/app/messages/${conv.id}`}
                className={cn(
                  'flex items-center gap-3.5 border-l-2 px-4 py-3.5 transition-colors',
                  isUnread
                    ? 'border-l-primary bg-primary/5 hover:bg-primary/10'
                    : 'border-l-transparent hover:bg-muted/60 active:bg-muted',
                )}
              >
                <UserAvatar
                  name={participantName}
                  size="md"
                  className="size-11 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-serif text-[15px] font-semibold text-foreground">
                      {participantName}
                    </p>
                    <span
                      suppressHydrationWarning
                      className={cn(
                        // 12 px : l'horodatage est lu, pas deviné (R3).
                        'shrink-0 text-xs',
                        isUnread
                          ? 'font-semibold text-secondary-foreground dark:text-primary'
                          : 'text-muted-foreground',
                      )}
                    >
                      {formatTime(lastAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'truncate text-sm',
                        isUnread
                          ? 'font-medium text-foreground/85'
                          : 'text-muted-foreground',
                      )}
                    >
                      {lastContent}
                    </p>
                    {isUnread && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
