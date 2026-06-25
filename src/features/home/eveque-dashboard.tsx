'use client';

import { BookOpen, Church, Clock, FileText, MessageSquare, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';

import { Card, CardEyebrow } from '@/components/ui/card/card';
import { QuickActionTile } from '@/components/ui/quick-action-tile';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { DioceseStatsSection } from '@/features/dashboard/components/diocese-stats-section';
import { useClericalInbox } from '@/features/messaging/api/get-clerical-inbox';
import { useAdminArticles } from '@/features/news/api/get-admin-articles';
import { useUser } from '@/lib/auth';
import { useParishes } from '@/lib/org/get-parishes';
import { cn } from '@/utils/cn';

// ── Hero éditorial ─────────────────────────────────────────────────────────────

function EvequeHero() {
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
          {greeting} · Conduite du diocèse
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

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Messages',
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    tone: 'info' as const,
  },
  {
    label: 'Articles',
    href: paths.app.admin.articles.getHref(),
    icon: FileText,
    tone: 'success' as const,
  },
  {
    label: 'Inviter',
    href: paths.app.admin.users.invite.getHref(),
    icon: Users,
    tone: 'primary' as const,
  },
  {
    label: 'Liturgie',
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    tone: 'warning' as const,
  },
  {
    label: 'Paroisses',
    href: paths.app.admin.org.getHref(),
    icon: Church,
    tone: 'gold' as const,
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
  parishCount: number;
  unreadCount: number;
  draftCount: number;
  loadingParishes: boolean;
  loadingMessages: boolean;
  loadingArticles: boolean;
}

function StatsRow({
  parishCount,
  unreadCount,
  draftCount,
  loadingParishes,
  loadingMessages,
  loadingArticles,
}: StatsRowProps) {
  const stats = [
    {
      label: 'Paroisses',
      value: parishCount,
      isLoading: loadingParishes,
      href: paths.app.admin.org.getHref(),
      color: 'text-accent',
    },
    {
      label: 'Non lus',
      value: unreadCount,
      isLoading: loadingMessages,
      href: paths.app.clerge.messages.getHref(),
      color: 'text-info',
    },
    {
      label: 'Brouillons',
      value: draftCount,
      isLoading: loadingArticles,
      href: paths.app.admin.articles.getHref(),
      color: 'text-success',
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Link key={stat.href} href={stat.href} className="group">
          <Card
            variant="feature"
            className="p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            <CardEyebrow>{stat.label}</CardEyebrow>
            {stat.isLoading ? (
              <Skeleton className="mt-2 h-8 w-10" />
            ) : (
              <span
                className={cn(
                  'mt-1 block font-serif text-2xl font-black tabular-nums',
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

// ── Recent messages section ───────────────────────────────────────────────────

interface RecentMessagesSectionProps {
  messages: Array<{ id: number; subject: string; sender_email: string; read_at?: string | null }>;
  isLoading: boolean;
}

function RecentMessagesSection({ messages, isLoading }: RecentMessagesSectionProps) {
  const recent = messages.slice(0, 3);

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
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
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
              <span className="text-sm font-medium text-foreground line-clamp-1">{message.subject}</span>
              {!message.read_at && <span className="size-2 shrink-0 rounded-full bg-info" />}
            </div>
            <p className="text-xs text-muted-foreground">{message.sender_email}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Draft articles section ────────────────────────────────────────────────────

interface DraftArticlesSectionProps {
  articles: Array<{ id: string; title: string; author_name: string; status: string }>;
  isLoading: boolean;
}

function DraftArticlesSection({ articles, isLoading }: DraftArticlesSectionProps) {
  const drafts = articles;

  return (
    <section>
      <SectionHeader
        eyebrow="Publication"
        title="Articles à publier"
        action={
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={paths.app.admin.articleNew.getHref()}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
            >
              <PlusCircle className="size-3.5" />
              Nouveau
            </Link>
            <Link
              href={paths.app.admin.articles.getHref()}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Tout voir
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        )}

        {!isLoading && drafts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Aucun brouillon en attente.</p>
          </div>
        )}

        {drafts.map((article) => (
          <Card
            key={article.id}
            variant="sacred"
            className="transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            <Link
              href={paths.app.admin.articles.getHref()}
              className="flex flex-col gap-0.5 p-3"
            >
              <span className="text-sm font-medium text-foreground line-clamp-1">{article.title}</span>
              <p className="text-xs text-muted-foreground">{article.author_name}</p>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EvequeeDashboard() {
  const { data: inboxData, isLoading: loadingMessages } = useClericalInbox();
  const { data: draftsData, isLoading: loadingArticles } = useAdminArticles({ status: 'draft', limit: 3 });
  const { data: parishes = [], isLoading: loadingParishes } = useParishes();

  const messages = inboxData?.results ?? [];
  const drafts = draftsData?.results ?? [];
  const unreadCount = messages.filter((m) => !m.read_at).length;
  const draftCount = draftsData?.count ?? 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8">
      <div className="flex flex-col gap-8">
        <EvequeHero />

        <StatsRow
          parishCount={parishes.length}
          unreadCount={unreadCount}
          draftCount={draftCount}
          loadingParishes={loadingParishes}
          loadingMessages={loadingMessages}
          loadingArticles={loadingArticles}
        />

        <DioceseStatsSection />

        {/* Accès rapides */}
        <section>
          <SectionHeader eyebrow="Raccourcis" title="Accès rapides" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

        <RecentMessagesSection messages={messages} isLoading={loadingMessages} />

        <div className="hairline-gold" aria-hidden="true" />

        <DraftArticlesSection articles={drafts} isLoading={loadingArticles} />
      </div>
    </div>
  );
}
