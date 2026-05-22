'use client';

import { BookOpen, CheckCircle, Clock, Inbox, MessageSquare, ScrollText } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { useClericalInbox } from '@/features/messaging/api/get-clerical-inbox';
import type { MassIntention } from '@/features/intentions/api/get-my-intentions';
import { useParishIntentions } from '@/features/intentions/api/get-parish-intentions';
import {
  useAcceptIntention,
  useCelebrateIntention,
} from '@/features/intentions/api/manage-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';
import { cn } from '@/lib/utils';

import { PastoralReflectionComposer } from '@/features/reflexion-pastorale/components/pastoral-reflection-composer';

import { WelcomeBanner } from './welcome-banner';

// ── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Intentions',
    href: paths.app.clerge.intentions.getHref(),
    icon: ScrollText,
    className: 'bg-amber-500/10 text-amber-600',
  },
  {
    label: 'Messages',
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    className: 'bg-blue-500/10 text-blue-600',
  },
  {
    label: 'Liturgie',
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    className: 'bg-orange-500/10 text-orange-500',
  },
  {
    label: 'Spirituel',
    href: paths.app.spirituel.getHref(),
    icon: BookOpen,
    className: 'bg-primary/10 text-primary',
  },
] as const;

// ── Stats row ─────────────────────────────────────────────────────────────────

interface StatsRowProps {
  pendingCount: number;
  unreadCount: number;
  loadingIntentions: boolean;
  loadingMessages: boolean;
}

function StatsRow({ pendingCount, unreadCount, loadingIntentions, loadingMessages }: StatsRowProps) {
  const stats = [
    {
      label: 'En attente',
      value: pendingCount,
      isLoading: loadingIntentions,
      href: paths.app.clerge.intentions.getHref(),
      color: 'text-amber-600',
    },
    {
      label: 'Non lus',
      value: unreadCount,
      isLoading: loadingMessages,
      href: paths.app.clerge.messages.getHref(),
      color: 'text-blue-600',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <Link
          key={stat.href}
          href={stat.href}
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
        >
          {stat.isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <span className={cn('text-3xl font-bold tabular-nums', stat.color)}>
              {stat.value}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ── Pending intention card ────────────────────────────────────────────────────

function PendingIntentionCard({ intention }: { intention: MassIntention }) {
  const { mutate: accept, isPending: accepting } = useAcceptIntention();
  const { mutate: celebrate, isPending: celebrating } = useCelebrateIntention();

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground line-clamp-2">{intention.intention_text}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {intention.requestor_email}
          </p>
        </div>
        <IntentionStatusBadge status={intention.status} />
      </div>

      <div className="flex gap-2">
        {intention.status === 'pending' && (
          <button
            type="button"
            onClick={() => accept(intention.id)}
            disabled={accepting}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <CheckCircle className="size-3.5" />
            Accepter
          </button>
        )}
        {(intention.status === 'accepted' || intention.status === 'date_proposed') && (
          <button
            type="button"
            onClick={() => celebrate(intention.id)}
            disabled={celebrating}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            <CheckCircle className="size-3.5" />
            Célébrée
          </button>
        )}
        <Link
          href={paths.app.clerge.intentions.getHref()}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Détails
        </Link>
      </div>
    </div>
  );
}

// ── Intentions section ───────────────────────────────────────────────────────

interface PendingIntentionsSectionProps {
  intentions: MassIntention[];
  isLoading: boolean;
}

function PendingIntentionsSection({ intentions, isLoading }: PendingIntentionsSectionProps) {
  const actionable = intentions.filter(
    (i) => i.status === 'pending' || i.status === 'accepted' || i.status === 'date_proposed',
  );
  const preview = actionable.slice(0, 3);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ScrollText className="size-4 text-amber-500" />
          Intentions à traiter
        </h2>
        <Link
          href={paths.app.clerge.intentions.getHref()}
          className="text-xs text-primary hover:underline"
        >
          Tout voir
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && preview.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <CheckCircle className="mx-auto mb-2 size-6 text-green-500/60" />
          <p className="text-sm text-muted-foreground">
            Aucune intention en attente.
          </p>
        </div>
      )}

      {preview.map((intention) => (
        <PendingIntentionCard key={intention.id} intention={intention} />
      ))}

      {actionable.length > 3 && (
        <Link
          href={paths.app.clerge.intentions.getHref()}
          className="text-center text-xs text-primary hover:underline"
        >
          +{actionable.length - 3} autres intentions
        </Link>
      )}
    </section>
  );
}

// ── Recent messages section ──────────────────────────────────────────────────

interface RecentMessagesSectionProps {
  messages: ClergicalMessage[];
  isLoading: boolean;
}

function RecentMessagesSection({ messages, isLoading }: RecentMessagesSectionProps) {
  const recent = messages.slice(0, 2);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Inbox className="size-4 text-blue-500" />
          Messages récents
        </h2>
        <Link
          href={paths.app.clerge.messages.getHref()}
          className="text-xs text-primary hover:underline"
        >
          Boîte de réception
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && recent.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucun message.</p>
        </div>
      )}

      {recent.map((message) => (
        <Link
          key={message.id}
          href={paths.app.clerge.messages.getHref()}
          className={cn(
            'flex flex-col gap-0.5 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted',
            !message.read_at && 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/20',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground line-clamp-1">
              {message.subject}
            </span>
            {!message.read_at && (
              <span className="size-2 flex-shrink-0 rounded-full bg-blue-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{message.sender_email}</p>
        </Link>
      ))}
    </section>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PretreeDashboard() {
  const { data: intentionsData, isLoading: loadingIntentions } = useParishIntentions();
  const { data: inboxData, isLoading: loadingMessages } = useClericalInbox();

  const intentions = intentionsData?.results ?? [];
  const messages = inboxData?.results ?? [];
  const pendingCount = intentions.filter((i) => i.status === 'pending').length;
  const unreadCount = messages.filter((m) => !m.read_at).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
      <div className="flex flex-col gap-6">
        <WelcomeBanner />

        <StatsRow
          pendingCount={pendingCount}
          unreadCount={unreadCount}
          loadingIntentions={loadingIntentions}
          loadingMessages={loadingMessages}
        />

        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted active:scale-[0.97]"
              >
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    action.className,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-center text-[11px] font-medium text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>

        <PastoralReflectionComposer />
        <PendingIntentionsSection intentions={intentions} isLoading={loadingIntentions} />
        <RecentMessagesSection messages={messages} isLoading={loadingMessages} />
      </div>
    </div>
  );
}
