'use client';

import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { useGetMessages } from '../api/get-messages';
import { useMarkRead } from '../api/mark-read';
import { useSendMessage } from '../api/send-message';
import { useChatSocket } from '../hooks/use-chat-socket';

interface ChatWindowProps {
  conversationId: string;
  participantName?: string;
}

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

export function ChatWindow({
  conversationId,
  participantName,
}: ChatWindowProps) {
  const router = useRouter();
  const [text, setText] = useState('');
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

  function doSend() {
    const content = text.trim();
    if (!content || isPending) return;
    setText('');
    send({ content });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSend();
  }

  const initials = getInitials(participantName ?? '?');

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
            {initials}
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
        {!isLoading && !data?.results.length && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Commencez la conversation…
          </p>
        )}
        <div className="flex flex-col gap-3">
          {data?.results.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.is_mine && (
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  msg.is_mine
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm border border-border bg-card text-foreground'
                }`}
              >
                <p className="leading-relaxed">{msg.content}</p>
                <p
                  suppressHydrationWarning
                  className={`mt-1 text-right text-[10px] ${
                    msg.is_mine
                      ? 'text-primary-foreground/60'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
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
