'use client';

import { BookOpen, Bot, Heart, RotateCw, Sparkles, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button/button';
import { ScriptureQuote } from '@/components/ui/scripture-quote';
import { cn } from '@/lib/utils';

export interface AppMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: Record<string, unknown>;
  /** Message d'échec de génération — affiche l'action « Réessayer ». */
  isError?: boolean;
}

interface ChatMessageProps {
  message: AppMessage;
  /** Relance la dernière question — fourni uniquement sur le message d'erreur. */
  onRetry?: () => void;
}

/* ─── Badge d'intention (module de routage RAG) ─── */

function IntentBadge({ intent }: { intent?: Record<string, unknown> }) {
  if (!intent || Object.keys(intent).length === 0) return null;

  const moduleStr =
    typeof intent.module === 'string' ? intent.module.toLowerCase() : '';
  const intentDesc =
    typeof intent.description === 'string' ? intent.description : '';

  let Icon = Sparkles;
  let label = moduleStr || 'Assistant';

  if (moduleStr.includes('bible') || intentDesc.includes('bible')) {
    Icon = BookOpen;
    label = 'Bible';
  } else if (moduleStr.includes('rosary') || intentDesc.includes('rosaire')) {
    Icon = Heart;
    label = 'Rosaire';
  } else if (
    moduleStr.includes('availability') ||
    moduleStr.includes('pretre')
  ) {
    Icon = User;
    label = 'Allo Prêtre';
  }

  return (
    <Badge
      variant="secondary"
      className="mb-2 flex w-fit items-center gap-1.5 text-xs"
    >
      <Icon className="size-3" />
      <span className="capitalize">{label}</span>
    </Badge>
  );
}

/* ─── Découpage de la réponse extractive du backend RAG ───
 *
 * Le service RAG (apps/rag) restitue les passages sous la forme :
 *   === PASSAGES BIBLIQUES ===
 *   Livre: Jean 3:16
 *   Texte: Car Dieu a tant aimé le monde…
 * On détecte ces paires pour les mettre en forme avec ScriptureQuote ;
 * tout le reste est rendu comme du texte courant.
 */

type ContentSegment =
  | { type: 'text'; text: string }
  | { type: 'verse'; reference: string; text: string; eyebrow?: string };

const SECTION_LABELS: Record<string, string> = {
  'PASSAGES BIBLIQUES': 'Passages bibliques',
  ROSAIRE: 'Rosaire',
};

function parseAssistantContent(content: string): ContentSegment[] {
  const lines = content.split('\n');
  const segments: ContentSegment[] = [];
  let textBuffer: string[] = [];
  let currentSection: string | undefined;

  const flushText = () => {
    const text = textBuffer.join('\n').trim();
    if (text) segments.push({ type: 'text', text });
    textBuffer = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const sectionMatch = line.match(/^===\s*(.+?)\s*===$/);
    if (sectionMatch) {
      flushText();
      currentSection = SECTION_LABELS[sectionMatch[1]] ?? sectionMatch[1];
      continue;
    }

    const bookMatch = line.match(/^Livre\s*:\s*(.+)$/);
    const textMatch = lines[i + 1]?.match(/^Texte\s*:\s*(.+)$/);
    if (bookMatch && textMatch) {
      flushText();
      const verseLines = [textMatch[1]];
      let j = i + 2;
      while (
        j < lines.length &&
        lines[j].trim() !== '' &&
        !/^Livre\s*:/.test(lines[j]) &&
        !/^===/.test(lines[j])
      ) {
        verseLines.push(lines[j]);
        j += 1;
      }
      segments.push({
        type: 'verse',
        reference: bookMatch[1].trim(),
        text: verseLines.join(' ').trim(),
        eyebrow: currentSection,
      });
      currentSection = undefined; // surtitre uniquement sur la 1re citation
      i = j - 1;
      continue;
    }

    textBuffer.push(line);
  }
  flushText();
  return segments;
}

/* ─── Texte courant (retours à la ligne + **gras**) ─── */

function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line.split(/(\*\*[^*]+\*\*)/).map((segment, j) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return (
                <strong key={j} className="font-semibold">
                  {segment.slice(2, -2)}
                </strong>
              );
            }
            return <span key={j}>{segment}</span>;
          })}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

/* ─── Contenu assistant : citations scripturaires + texte ─── */

function AssistantContent({ text }: { text: string }) {
  const segments = parseAssistantContent(text);
  return (
    <div className="flex flex-col gap-3">
      {segments.map((segment, i) =>
        segment.type === 'verse' ? (
          <ScriptureQuote
            key={i}
            size="sm"
            text={segment.text}
            reference={segment.reference}
            eyebrow={segment.eyebrow}
          />
        ) : (
          <div key={i}>
            <FormattedText text={segment.text} />
          </div>
        ),
      )}
    </div>
  );
}

/* ─── Bulle de message ─── */

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-accent/10' : 'bg-primary/10',
        )}
      >
        {isUser ? (
          <User className="size-4 text-accent" />
        ) : (
          <Bot className="size-4 text-primary" />
        )}
      </div>

      {/* Contenu */}
      <div
        className={cn('flex max-w-[85%] flex-col gap-2', isUser && 'items-end')}
      >
        <div
          role={message.isError ? 'alert' : undefined}
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : message.isError
                ? 'rounded-tl-sm border border-destructive/30 bg-destructive/5 text-foreground'
                : 'rounded-tl-sm border border-border bg-background-surface text-foreground',
          )}
        >
          {/* Badge d'intention sur les réponses de l'assistant */}
          {!isUser && !message.isError && message.intent && (
            <IntentBadge intent={message.intent} />
          )}

          {isUser ? (
            <FormattedText text={message.content} />
          ) : (
            <AssistantContent text={message.content} />
          )}

          {message.isError && onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              icon={<RotateCw className="size-3.5" aria-hidden="true" />}
              onClick={onRetry}
            >
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
