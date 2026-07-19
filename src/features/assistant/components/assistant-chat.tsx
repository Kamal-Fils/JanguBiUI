'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { paths } from '@/config/paths';
import { postRagQuery } from '@/features/assistant/api/post-rag-query';
import { cn } from '@/lib/utils';

import { ChatMessage, type AppMessage } from './chat-message';
import { SuggestionChips } from './suggestion-chips';

const GENERATION_ERROR_MESSAGE =
  "Je n'ai pas pu générer de réponse pour le moment. Vérifiez votre connexion, puis réessayez.";

export function AssistantChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: postRagQuery,
    onSuccess: (data) => {
      setLastFailedQuery(null);
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
    onError: (_error, variables) => {
      setLastFailedQuery(variables.query);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: GENERATION_ERROR_MESSAGE,
          isError: true,
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

  /** Ajoute la bulle utilisateur puis interroge l'assistant. */
  const sendQuery = (raw: string) => {
    const query = raw.trim();
    if (!query || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: query },
    ]);
    mutation.mutate({ query });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const query = input;
    setInput('');
    sendQuery(query);
  };

  /** Relance la dernière question échouée sans dupliquer la bulle utilisateur. */
  const handleRetry = () => {
    if (!lastFailedQuery || isLoading) return;
    setMessages((prev) => prev.filter((m) => !m.isError));
    mutation.mutate({ query: lastFailedQuery });
  };

  return (
    <div className="flex h-dvh flex-col">
      {/* En-tête */}
      <header className="bg-background-surface/95 sticky top-0 z-40 border-b border-border px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {/* Vue plein écran exemptée de l'AppHeader → retour porté par
              l'en-tête custom, vers le parent logique (hub Spiritualité). */}
          <Link
            href={paths.app.spirituel.getHref()}
            aria-label="Retour"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
            <Bot className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Assistant Jàngu Bi
            </h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'En train de répondre…' : 'Bible, Chapelet, Prêtres'}
            </p>
          </div>
        </div>
      </header>

      {/* Fil de conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            <WelcomeState onSuggestion={sendQuery} />
          ) : (
            <div
              className="flex flex-col gap-4 pt-4"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label="Conversation avec l'assistant"
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRetry={message.isError ? handleRetry : undefined}
                />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="size-4 text-primary" aria-hidden="true" />
                  </div>
                  {/* Réflexion en cours : l'animation seule ne dit rien à qui
                      ne la voit pas (mouvement réduit, lecteur d'écran) — le
                      libellé est donc écrit, pas seulement annoncé. */}
                  <div
                    className="bg-background-surface flex items-center gap-2.5 rounded-2xl rounded-tl-sm border border-border px-4 py-3"
                    role="status"
                  >
                    <span className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="size-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
                      <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:150ms] motion-reduce:animate-none" />
                      <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:300ms] motion-reduce:animate-none" />
                    </span>
                    <span className="text-sm text-muted-foreground">
                      L&apos;assistant cherche dans les Écritures…
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Raccourcis après la première réponse */}
      {messages.length > 0 && !isLoading && (
        <div className="border-t border-border bg-background px-4 py-2">
          <div className="mx-auto max-w-3xl">
            <SuggestionChips onSelect={sendQuery} compact />
          </div>
        </div>
      )}

      {/* Saisie */}
      <div className="bg-background-surface border-t border-border px-4 pb-20 pt-3">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
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
              placeholder="Posez votre question…"
              rows={1}
              className={cn(
                // text-base (16px) : en dessous, iOS zoome au focus et le
                // texte devient illisible dehors (R3).
                'min-h-11 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground',
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
            <Send className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ─── Écran d'accueil avant le premier message ─── */

/**
 * Première visite : la question n'est pas « bonjour », c'est **que puis-je
 * demander ?**. On répond par l'échelle (R2) puis par des exemples réels,
 * cliquables — le fidèle part d'une vraie question, pas d'une page blanche.
 */
function WelcomeState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-7 pb-8 pt-12">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Assistant spirituel
        </p>
        <h2 className="mt-3 font-serif text-headline font-bold tracking-tight text-foreground">
          Que souhaitez-vous demander&nbsp;?
        </h2>
        <p className="max-w-reading mt-3 text-base leading-relaxed text-muted-foreground">
          Posez votre question sur la Bible, le chapelet ou la prière du jour.
          Vous pouvez aussi chercher un prêtre disponible près de chez vous.
        </p>
        <div className="hairline-gold mt-6" aria-hidden="true" />
      </div>
      <SuggestionChips onSelect={onSuggestion} />
    </div>
  );
}
