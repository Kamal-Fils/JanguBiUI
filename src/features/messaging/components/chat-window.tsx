'use client';

import {
  ArrowLeft,
  ArrowDown,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Send,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button/button';
import {
  Card,
  CardContent,
  CardEyebrow,
  CardTitle,
} from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { useAcceptMessagingCgu } from '../api/accept-cgu';
import {
  MESSAGES_PAGE_SIZE,
  useGetMessages,
  useLoadOlderMessages,
} from '../api/get-messages';
import { useMarkRead } from '../api/mark-read';
import { OPTIMISTIC_ID_PREFIX, useSendMessage } from '../api/send-message';
import { useChatSocket } from '../hooks/use-chat-socket';
import type { Message } from '../types';

import { ConnectionBanner } from './connection-banner';

/** Tolérance (px) pour considérer que l'utilisateur est « collé en bas ». */
const SCROLL_BOTTOM_THRESHOLD = 80;

const LONG_MESSAGE_THRESHOLD = 200;
const GROUP_TIME_GAP_MS = 3 * 60 * 1000; // 3 minutes

interface ChatWindowProps {
  conversationId: string;
  participantName?: string;
}

type MessagePosition = 'alone' | 'first' | 'middle' | 'last';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Libellé du séparateur de journée : Aujourd'hui / Hier / date longue. */
function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Aujourd'hui";
  if (sameDay(date, yesterday)) return 'Hier';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== today.getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  });
}

function isSameGroup(previous: Message, current: Message): boolean {
  if (previous.is_mine !== current.is_mine) return false;
  if (!previous.is_mine && previous.sender_id !== current.sender_id)
    return false;
  // Un changement de journée casse toujours le groupe (séparateur de date).
  if (!isSameDay(previous.created_at, current.created_at)) return false;
  const timeDiff =
    new Date(current.created_at).getTime() -
    new Date(previous.created_at).getTime();
  return timeDiff < GROUP_TIME_GAP_MS;
}

function getMessagePosition(
  messages: Message[],
  index: number,
): MessagePosition {
  const previous = messages[index - 1];
  const current = messages[index];
  const next = messages[index + 1];

  const connectedToPrev = previous ? isSameGroup(previous, current) : false;
  const connectedToNext = next ? isSameGroup(current, next) : false;

  if (!connectedToPrev && !connectedToNext) return 'alone';
  if (!connectedToPrev && connectedToNext) return 'first';
  if (connectedToPrev && connectedToNext) return 'middle';
  return 'last';
}

function getBubbleRadius(isMine: boolean, position: MessagePosition): string {
  if (isMine) {
    switch (position) {
      case 'alone':
        return 'rounded-2xl rounded-br-sm';
      case 'first':
        return 'rounded-2xl rounded-br-sm';
      case 'middle':
        return 'rounded-l-2xl rounded-r-lg';
      case 'last':
        return 'rounded-l-2xl rounded-b-2xl rounded-tr-lg';
    }
  } else {
    switch (position) {
      case 'alone':
        return 'rounded-2xl rounded-bl-sm';
      case 'first':
        return 'rounded-2xl rounded-bl-sm';
      case 'middle':
        return 'rounded-r-2xl rounded-l-lg';
      case 'last':
        return 'rounded-r-2xl rounded-b-2xl rounded-tl-lg';
    }
  }
}

function getVerticalGap(position: MessagePosition): string {
  return position === 'alone' || position === 'last' ? 'mt-3' : 'mt-0.5';
}

function isOptimistic(message: Message): boolean {
  return message.id.startsWith(OPTIMISTIC_ID_PREFIX);
}

// ── DaySeparator ──────────────────────────────────────────────────────────────

/** Séparateur éditorial entre deux journées : filets or + pastille datée. */
function DaySeparator({ iso }: { iso: string }) {
  return (
    <div className="mb-1 mt-5 flex items-center gap-3 first:mt-1">
      <div className="hairline-gold flex-1" aria-hidden="true" />
      <span
        suppressHydrationWarning
        className="shrink-0 rounded-full bg-muted/70 px-3 py-1 text-[11px] font-medium capitalize text-muted-foreground"
      >
        {formatDayLabel(iso)}
      </span>
      <div className="hairline-gold flex-1" aria-hidden="true" />
    </div>
  );
}

// ── ReadReceipt ───────────────────────────────────────────────────────────────

/**
 * Indicateur d'accusé de lecture sur les messages sortants.
 * - en cours d'envoi (optimiste) → simple coche atténuée + libellé masqué
 * - envoyé non lu → simple coche
 * - lu → double coche
 * Le `title`/`aria-label` porte le sens (jamais la couleur/forme seule).
 */
function ReadReceipt({ message }: { message: Message }) {
  if (isOptimistic(message)) {
    return (
      <Check
        className="size-3 opacity-50"
        aria-label="Envoi en cours"
        role="img"
      />
    );
  }
  if (message.read_at) {
    return <CheckCheck className="size-3" aria-label="Lu" role="img" />;
  }
  return <Check className="size-3" aria-label="Envoyé" role="img" />;
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  position: MessagePosition;
  participantName: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function MessageBubble({
  message,
  position,
  participantName,
  isExpanded,
  onToggleExpand,
}: MessageBubbleProps) {
  const isLast = position === 'alone' || position === 'last';
  const showAvatar = !message.is_mine;
  const isLong = message.content.length > LONG_MESSAGE_THRESHOLD;

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        message.is_mine ? 'justify-end' : 'justify-start',
        getVerticalGap(position),
      )}
    >
      {/* Avatar placeholder — always reserve space for alignment */}
      {showAvatar && (
        <div className="size-7 shrink-0">
          {isLast && (
            <UserAvatar
              name={participantName}
              size="sm"
              className="size-7 text-[10px]"
            />
          )}
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] md:max-w-[60%] px-4 py-2.5 text-sm',
          getBubbleRadius(message.is_mine, position),
          message.is_mine
            ? 'bg-primary text-primary-foreground shadow-soft-sm'
            : 'border border-border/60 bg-card text-foreground shadow-soft-sm',
        )}
      >
        {/* Message content */}
        <p
          className={cn(
            'leading-relaxed whitespace-pre-wrap break-words',
            isLong && !isExpanded && 'line-clamp-4',
          )}
        >
          {message.content}
        </p>

        {/* Expand / collapse for long messages */}
        {isLong && (
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn(
              'mt-1 flex items-center gap-1 rounded text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              message.is_mine
                ? 'text-primary-foreground/70 hover:text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-3" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="size-3" />
                Voir plus
              </>
            )}
          </button>
        )}

        {/* Timestamp + accusé de lecture — only on last message of group */}
        {isLast && (
          <div
            className={cn(
              'mt-1 flex items-center justify-end gap-1 text-[10px]',
              message.is_mine
                ? 'text-primary-foreground/60'
                : 'text-muted-foreground',
            )}
          >
            <span suppressHydrationWarning>
              {formatTime(message.created_at)}
            </span>
            {message.is_mine && <ReadReceipt message={message} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ChatWindow ────────────────────────────────────────────────────────────────

export function ChatWindow({
  conversationId,
  participantName,
}: ChatWindowProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const hasScrolledOnceRef = useRef(false);

  const { data, isLoading, error, refetch } = useGetMessages(conversationId);
  const { mutate: loadOlder, isPending: isLoadingOlder } =
    useLoadOlderMessages(conversationId);
  const [reachedStart, setReachedStart] = useState(false);
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { mutate: markRead } = useMarkRead(conversationId);
  const { mutate: acceptCgu, isPending: isAcceptingCgu } =
    useAcceptMessagingCgu(conversationId);
  const { status: socketStatus, retry: retrySocket } =
    useChatSocket(conversationId);

  const needsCguAcceptance =
    error instanceof ApiError && error.status === 403;
  const hasGenericError = !!error && !needsCguAcceptance;

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    bottomRef.current?.scrollIntoView({ behavior });
    isAtBottomRef.current = true;
    setShowNewMessagePill(false);
  }, []);

  // Suit la position de l'utilisateur : « collé en bas » ou non.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
    isAtBottomRef.current = atBottom;
    if (atBottom) setShowNewMessagePill(false);
  }, []);

  useEffect(() => {
    markRead();
  }, [conversationId, markRead]);

  const messageCount = data?.results.length ?? 0;

  useEffect(() => {
    if (messageCount === 0) return;
    // Premier rendu : scroll instantané jusqu'en bas.
    if (!hasScrolledOnceRef.current) {
      hasScrolledOnceRef.current = true;
      scrollToBottom('auto');
      return;
    }
    // Nouveaux messages : on reste collé en bas si l'utilisateur y est,
    // sinon on propose une pastille « Nouveau message ↓ ».
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    } else {
      setShowNewMessagePill(true);
    }
  }, [messageCount, scrollToBottom]);

  // Réinitialise l'état de scroll quand on change de conversation.
  useEffect(() => {
    hasScrolledOnceRef.current = false;
    isAtBottomRef.current = true;
    setShowNewMessagePill(false);
  }, [conversationId]);

  function toggleMessageExpansion(messageId: string) {
    setExpandedMessages((previous) => {
      const updated = new Set(previous);
      if (updated.has(messageId)) {
        updated.delete(messageId);
      } else {
        updated.add(messageId);
      }
      return updated;
    });
  }

  function doSend() {
    const content = text.trim();
    if (!content || isPending) return;
    setText('');
    send({ content });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSend();
  }

  const messages = useMemo(() => data?.results ?? [], [data?.results]);
  const canLoadOlder = !reachedStart && messages.length >= MESSAGES_PAGE_SIZE;

  // Charge la page précédente (before_id) en préservant la position de lecture
  // malgré le contenu prépendu en haut du fil.
  const handleLoadOlder = useCallback(() => {
    const oldest = messages[0];
    const el = scrollRef.current;
    if (!oldest || !el) return;
    const prevHeight = el.scrollHeight;
    loadOlder(oldest.id, {
      onSuccess: (older) => {
        if (older.results.length < MESSAGES_PAGE_SIZE) setReachedStart(true);
        requestAnimationFrame(() => {
          const node = scrollRef.current;
          if (node) node.scrollTop += node.scrollHeight - prevHeight;
        });
      },
    });
  }, [messages, loadOlder]);

  return (
    <div className="flex h-dvh flex-col md:h-full">
      {/* Header */}
      <div className="relative flex shrink-0 items-center gap-3 bg-background-surface/90 px-4 py-3 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="-ml-2 rounded-full hover:bg-muted md:hidden"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <UserAvatar
          name={participantName ?? '?'}
          size="md"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[15px] font-semibold text-foreground">
            {participantName ?? 'Conversation'}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {socketStatus === 'online' ? (
              <>
                <span
                  className="size-1.5 rounded-full bg-success"
                  aria-hidden="true"
                />
                Temps réel actif
              </>
            ) : (
              'Échange confidentiel'
            )}
          </span>
        </div>
        {/* Filet or éditorial sous l'en-tête */}
        <div
          className="hairline-gold absolute inset-x-4 bottom-0"
          aria-hidden="true"
        />
      </div>

      {/* Bannière d'état temps réel */}
      <ConnectionBanner status={socketStatus} onRetry={retrySocket} />

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label="Fil de la conversation"
          aria-relevant="additions"
          className="bg-paper h-full overflow-y-auto p-4"
        >
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground motion-reduce:animate-none" />
            </div>
          )}
          {needsCguAcceptance && (
            <div className="flex justify-center py-8">
              <Card variant="sacred" className="max-w-sm text-center">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                  <CardEyebrow>Messagerie sécurisée</CardEyebrow>
                  <CardTitle className="font-serif text-lg">
                    Accepter les CGU de messagerie
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Pour préserver la confidentialité de vos échanges, vous
                    devez accepter les conditions d’utilisation de la
                    messagerie. Cette acceptation ne vous sera demandée
                    qu’une seule fois, pour toutes vos conversations.
                  </p>
                  <Button
                    variant="default"
                    isLoading={isAcceptingCgu}
                    onClick={() => acceptCgu()}
                  >
                    Accepter les CGU
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          {hasGenericError && (
            <div className="py-8">
              <ErrorState
                title="Impossible d’ouvrir la conversation"
                description="Le chargement des messages a échoué. Veuillez réessayer."
                onRetry={() => refetch()}
                className="mx-auto max-w-sm"
              />
            </div>
          )}
          {!isLoading && !error && !messages.length && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="size-6" aria-hidden="true" />
              </div>
              <p className="font-serif text-base font-semibold text-foreground">
                Commencez la conversation…
              </p>
              <p className="max-w-[280px] text-xs text-muted-foreground">
                Vos échanges sont confidentiels, entre vous et votre
                interlocuteur.
              </p>
            </div>
          )}
          {!error && canLoadOlder && (
            <div className="flex justify-center pb-3">
              <button
                type="button"
                onClick={handleLoadOlder}
                disabled={isLoadingOlder}
                className="rounded-full border border-border/70 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
              >
                {isLoadingOlder
                  ? 'Chargement…'
                  : 'Voir les messages précédents'}
              </button>
            </div>
          )}
          {!error && (
            <div className="flex flex-col">
              {messages.map((message, index) => {
                const position = getMessagePosition(messages, index);
                const previous = messages[index - 1];
                const showDaySeparator =
                  !previous ||
                  !isSameDay(previous.created_at, message.created_at);
                return (
                  <Fragment key={message.id}>
                    {showDaySeparator && (
                      <DaySeparator iso={message.created_at} />
                    )}
                    <MessageBubble
                      message={message}
                      position={position}
                      participantName={participantName ?? '?'}
                      isExpanded={expandedMessages.has(message.id)}
                      onToggleExpand={() => toggleMessageExpansion(message.id)}
                    />
                  </Fragment>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Pastille « Nouveau message ↓ » — n'interrompt pas la lecture */}
        {showNewMessagePill && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            Nouveau message
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleFormSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-border/60 bg-background-surface/80 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              doSend();
            }
          }}
          placeholder="Votre message…"
          aria-label="Votre message"
          rows={1}
          className="max-h-[120px] min-h-11 flex-1 resize-none rounded-2xl border border-border/70 bg-background px-4 py-2.5 text-sm text-foreground shadow-soft-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || isPending}
          isLoading={isPending}
          icon={<Send className="size-4" />}
          className="shrink-0 rounded-full disabled:opacity-40"
          aria-label="Envoyer"
        />
      </form>
    </div>
  );
}
