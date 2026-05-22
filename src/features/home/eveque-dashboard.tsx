'use client';

import { BookOpen, Church, Clock, FileText, Inbox, MessageSquare, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useAdminArticles } from '@/features/news/api/get-admin-articles';
import { useParishes } from '@/features/org/api/get-parishes';
import { useClericalInbox } from '@/features/messaging/api/get-clerical-inbox';
import { cn } from '@/lib/utils';

import { WelcomeBanner } from './welcome-banner';

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Messages',
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    className: 'bg-blue-500/10 text-blue-600',
  },
  {
    label: 'Articles',
    href: paths.app.admin.articles.getHref(),
    icon: FileText,
    className: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    label: 'Inviter',
    href: paths.app.admin.users.invite.getHref(),
    icon: Users,
    className: 'bg-violet-500/10 text-violet-600',
  },
  {
    label: 'Liturgie',
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    className: 'bg-orange-500/10 text-orange-500',
  },
  {
    label: 'Paroisses',
    href: paths.app.admin.org.getHref(),
    icon: Church,
    className: 'bg-amber-500/10 text-amber-600',
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
      color: 'text-amber-600',
    },
    {
      label: 'Non lus',
      value: unreadCount,
      isLoading: loadingMessages,
      href: paths.app.clerge.messages.getHref(),
      color: 'text-blue-600',
    },
    {
      label: 'Brouillons',
      value: draftCount,
      isLoading: loadingArticles,
      href: paths.app.admin.articles.getHref(),
      color: 'text-emerald-600',
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Link
          key={stat.href}
          href={stat.href}
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted"
        >
          {stat.isLoading ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <span className={cn('text-2xl font-bold tabular-nums', stat.color)}>
              {stat.value}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{stat.label}</span>
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Inbox className="size-4 text-blue-500" />
          Messages récents
        </h2>
        <Link href={paths.app.clerge.messages.getHref()} className="text-xs text-primary hover:underline">
          Boîte de réception
        </Link>
      </div>

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
            !message.read_at && 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/20',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground line-clamp-1">{message.subject}</span>
            {!message.read_at && <span className="size-2 flex-shrink-0 rounded-full bg-blue-500" />}
          </div>
          <p className="text-xs text-muted-foreground">{message.sender_email}</p>
        </Link>
      ))}
    </section>
  );
}

// ── Draft articles section ────────────────────────────────────────────────────

interface DraftArticlesSectionProps {
  articles: Array<{ id: string; title: string; author_name: string; status: string }>;
  isLoading: boolean;
}

function DraftArticlesSection({ articles, isLoading }: DraftArticlesSectionProps) {
  const drafts = articles.filter((a) => a.status === 'draft').slice(0, 3);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="size-4 text-emerald-500" />
          Articles à publier
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href={paths.app.admin.articleNew.getHref()}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <PlusCircle className="size-3" />
            Nouveau
          </Link>
          <Link href={paths.app.admin.articles.getHref()} className="text-xs text-primary hover:underline">
            Tout voir
          </Link>
        </div>
      </div>

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
        <Link
          key={article.id}
          href={paths.app.admin.articles.getHref()}
          className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted"
        >
          <span className="text-sm font-medium text-foreground line-clamp-1">{article.title}</span>
          <p className="text-xs text-muted-foreground">{article.author_name}</p>
        </Link>
      ))}
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EvequeeDashboard() {
  const { data: inboxData, isLoading: loadingMessages } = useClericalInbox();
  const { data: articlesData, isLoading: loadingArticles } = useAdminArticles({ limit: 10 });
  const { data: parishes = [], isLoading: loadingParishes } = useParishes();

  const messages = inboxData?.results ?? [];
  const articles = articlesData?.results ?? [];
  const unreadCount = messages.filter((m) => !m.read_at).length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
      <div className="flex flex-col gap-6">
        <WelcomeBanner />

        <StatsRow
          parishCount={parishes.length}
          unreadCount={unreadCount}
          draftCount={draftCount}
          loadingParishes={loadingParishes}
          loadingMessages={loadingMessages}
          loadingArticles={loadingArticles}
        />

        {/* Quick actions — 2 rows of 3 */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted active:scale-[0.97]"
              >
                <div className={cn('flex size-9 items-center justify-center rounded-xl', action.className)}>
                  <Icon className="size-4" />
                </div>
                <span className="text-center text-[11px] font-medium text-foreground">{action.label}</span>
              </Link>
            );
          })}
        </div>

        <RecentMessagesSection messages={messages} isLoading={loadingMessages} />
        <DraftArticlesSection articles={articles} isLoading={loadingArticles} />
      </div>
    </div>
  );
}
