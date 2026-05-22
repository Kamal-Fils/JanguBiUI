'use client';

import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import { useGetMessages } from '../api/get-messages';
import { useMarkRead } from '../api/mark-read';
import { useSendMessage } from '../api/send-message';
import { useChatSocket } from '../hooks/use-chat-socket';
import type { Message } from '../types';

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

function getInitials(name: string): string {
  return (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function isSameGroup(previous: Message, current: Message): boolean {
  if (previous.is_mine !== current.is_mine) return false;
  if (!previous.is_mine && previous.sender_id !== current.sender_id) return false;
  const timeDiff =
    new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
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
      case 'alone': return 'rounded-2xl rounded-br-sm';
      case 'first': return 'rounded-2xl rounded-br-sm';
      case 'middle': return 'rounded-l-2xl rounded-r-lg';
      case 'last': return 'rounded-l-2xl rounded-b-2xl rounded-tr-lg';
    }
  } else {
    switch (position) {
      case 'alone': return 'rounded-2xl rounded-bl-sm';
      case 'first': return 'rounded-2xl rounded-bl-sm';
      case 'middle': return 'rounded-r-2xl rounded-l-lg';
      case 'last': return 'rounded-r-2xl rounded-b-2xl rounded-tl-lg';
    }
  }
}

function getVerticalGap(position: MessagePosition): string {
  return position === 'alone' || position === 'last' ? 'mt-3' : 'mt-0.5';
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  position: MessagePosition;
  participantInitials: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function MessageBubble({
  message,
  position,
  participantInitials,
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
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] md:max-w-[60%] px-3.5 py-2.5 text-sm shadow-sm',
          getBubbleRadius(message.is_mine, position),
          message.is_mine
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card text-foreground',
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
              'mt-1 flex items-center gap-1 text-[11px] font-medium',
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

        {/* Timestamp — only on last message of group */}
        {isLast && (
          <p
            suppressHydrationWarning
            className={cn(
              'mt-1 text-right text-[10px]',
              message.is_mine
                ? 'text-primary-foreground/60'
                : 'text-muted-foreground',
            )}
          >
            {formatTime(message.created_at)}
          </p>
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
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetMessages(conversationId);
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { mutate: markRead } = useMarkRead(conversationId);
  useChatSocket(conversationId);

  useEffect(() => {
    markRead();
  }, [conversationId, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.results.length]);

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

  const participantInitials = getInitials(participantName ?? '?');
  const messages = data?.results ?? [];

  return (
    <div className="flex h-dvh flex-col md:h-full">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted md:hidden"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {participantInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">
            {participantName ?? 'Conversation'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && !messages.length && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Commencez la conversation…
          </p>
        )}
        <div className="flex flex-col">
          {messages.map((message, index) => {
            const position = getMessagePosition(messages, index);
            return (
              <MessageBubble
                key={message.id}
                message={message}
                position={position}
                participantInitials={participantInitials}
                isExpanded={expandedMessages.has(message.id)}
                onToggleExpand={() => toggleMessageExpansion(message.id)}
              />
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleFormSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-border bg-background px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
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
          rows={1}
          className="max-h-[120px] flex-1 resize-none rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!text.trim() || isPending}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm disabled:opacity-40"
          aria-label="Envoyer"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </form>
    </div>
  );
}
