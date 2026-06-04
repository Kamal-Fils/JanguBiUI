'use client';

import { useMutation } from '@tanstack/react-query';
import { Send, Bot, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button/button';
import { postRagQuery } from '@/features/assistant/api/post-rag-query';
import { cn } from '@/lib/utils';

import { ChatMessage, type AppMessage } from './chat-message';
import { SuggestionChips } from './suggestion-chips';

export function AssistantChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: postRagQuery,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer || '',
          intent: (data.intent as Record<string, unknown>) || undefined,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            "Desole, une erreur s'est produite lors de la generation de la reponse. Veuillez reessayer.",
        },
      ]);
    },
  });

  const isLoading = mutation.isPending;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: query,
      },
    ]);

    mutation.mutate({ query });
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      },
    ]);

    mutation.mutate({ query: text });
  };

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="bg-background-surface/95 sticky top-0 z-40 border-b border-border px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
            <Bot className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Assistant Jangu Bi
            </h1>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? 'En train de répondre…'
                : 'Bible, Chapelet, Prêtres'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto max-w-2xl">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <div
              className="flex flex-col gap-4 pt-4"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label="Conversation avec l'assistant"
            >
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="size-4 text-primary" />
                  </div>
                  <div className="bg-background-surface rounded-2xl rounded-tl-sm border border-border px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 animate-pulse rounded-full bg-primary" />
                      <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                      <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Suggestion chips after first response */}
      {messages.length > 0 && !isLoading && (
        <div className="border-t border-border bg-background px-4 py-2">
          <div className="mx-auto max-w-2xl">
            <SuggestionChips onSelect={handleSuggestion} compact />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-background-surface border-t border-border px-4 pb-20 pt-3">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Posez votre question..."
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              disabled={isLoading}
              aria-label="Votre message"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="hover:bg-primary-hover size-11 shrink-0 rounded-xl bg-primary text-primary-foreground"
            aria-label="Envoyer le message"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ─── Empty state shown before first message ─── */
function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 pb-8 pt-16">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="size-8 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Bienvenue dans l&apos;Assistant
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Je suis votre compagnon spirituel. Posez-moi vos questions sur la
          Bible, le chapelet, ou trouvez un pretre disponible.
        </p>
      </div>
      <SuggestionChips onSelect={onSuggestion} />
    </div>
  );
}
