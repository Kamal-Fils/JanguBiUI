'use client';

import { BookOpen, CheckCircle, Clock, MessageSquare, ScrollText } from 'lucide-react';
import Link from 'next/link';

import { Card, CardEyebrow } from '@/components/ui/card/card';
import { QuickActionTile } from '@/components/ui/quick-action-tile';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { ParishStatsSection } from '@/features/dashboard/components/parish-stats-section';
import type { MassIntention } from '@/features/intentions/api/get-my-intentions';
import { useParishIntentions } from '@/features/intentions/api/get-parish-intentions';
import {
  useAcceptIntention,
  useCelebrateIntention,
} from '@/features/intentions/api/manage-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';
import { useClericalInbox } from '@/features/messaging/api/get-clerical-inbox';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { PastoralReflectionComposer } from '@/features/reflexion-pastorale/components/pastoral-reflection-composer';
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

// ── Hero éditorial ─────────────────────────────────────────────────────────────

function PretreHero() {
  const { data: user } = useUser();

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const firstName = user?.profile?.first_name ?? '';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-7 text-primary-foreground shadow-glow-indigo motion-safe:animate-slide-up sm:p-9">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(currentColor 0.6px, transparent 0.6px)',
            backgroundSize: '14px 14px',
          }}
        />
        <svg
          className="absolute -right-6 -top-10 size-56 text-primary-foreground/10 sm:size-64"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="10" y="2" width="4" height="20" rx="2" />
          <rect x="2" y="8" width="20" height="4" rx="2" />
        </svg>
      </div>

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
          {greeting} · Espace pastoral
        </p>
        <h1 className="mt-1 truncate font-serif text-display font-black italic leading-[0.95] text-primary-foreground">
          {firstName || 'Bienvenue'}
        </h1>
        <div className="mt-4 h-px w-16 rounded-full bg-gold/70" aria-hidden="true" />
        <p className="mt-3 text-sm capitalize text-primary-foreground/75">
          {dateStr}
        </p>
      </div>
    </div>
  );
}

// ── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Intentions',
    href: paths.app.clerge.intentions.getHref(),
    icon: ScrollText,
    tone: 'gold' as const,
  },
  {
    label: 'Messages',
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    tone: 'info' as const,
  },
  {
    label: 'Liturgie',
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    tone: 'warning' as const,
  },
  {
    label: 'Spiritualité',
    href: paths.app.spirituel.getHref(),
    icon: BookOpen,
    tone: 'primary' as const,
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
      color: 'text-accent',
    },
    {
      label: 'Non lus',
      value: unreadCount,
      isLoading: loadingMessages,
      href: paths.app.clerge.messages.getHref(),
      color: 'text-info',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <Link key={stat.href} href={stat.href} className="group">
          <Card
            variant="feature"
            className="p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            <CardEyebrow>{stat.label}</CardEyebrow>
            {stat.isLoading ? (
              <Skeleton className="mt-2 h-9 w-12" />
            ) : (
              <span
                className={cn(
                  'mt-1 block font-serif text-3xl font-black tabular-nums',
                  stat.color,
                )}
              >
                {stat.value}
              </span>
            )}
          </Card>
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
    <Card variant="sacred" className="space-y-3 p-4">
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
            className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
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
    </Card>
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
    <section>
      <SectionHeader
        eyebrow="À traiter"
        title="Intentions de messe"
        actionHref={paths.app.clerge.intentions.getHref()}
      />

      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && preview.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <CheckCircle className="mx-auto mb-2 size-6 text-success/60" />
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
      </div>
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
    <section>
      <SectionHeader
        eyebrow="Boîte de réception"
        title="Messages récents"
        actionHref={paths.app.clerge.messages.getHref()}
        actionLabel="Tout voir"
      />

      <div className="flex flex-col gap-3">
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
              !message.read_at && 'border-info/30 bg-info/5',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground line-clamp-1">
                {message.subject}
              </span>
              {!message.read_at && (
                <span className="size-2 shrink-0 rounded-full bg-info" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{message.sender_email}</p>
          </Link>
        ))}
      </div>
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
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8">
      <div className="flex flex-col gap-8">
        <PretreHero />

        <StatsRow
          pendingCount={pendingCount}
          unreadCount={unreadCount}
          loadingIntentions={loadingIntentions}
          loadingMessages={loadingMessages}
        />

        <ParishStatsSection />

        {/* Accès rapides */}
        <section>
          <SectionHeader eyebrow="Raccourcis" title="Accès rapides" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <QuickActionTile
                  key={action.href}
                  href={action.href}
                  icon={<Icon />}
                  label={action.label}
                  tone={action.tone}
                />
              );
            })}
          </div>
        </section>

        <div className="hairline-gold" aria-hidden="true" />

        <PastoralReflectionComposer />
        <PendingIntentionsSection intentions={intentions} isLoading={loadingIntentions} />

        <div className="hairline-gold" aria-hidden="true" />

        <RecentMessagesSection messages={messages} isLoading={loadingMessages} />
      </div>
    </div>
  );
}
