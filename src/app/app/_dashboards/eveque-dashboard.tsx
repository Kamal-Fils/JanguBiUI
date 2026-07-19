'use client';

import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { ErrorState } from '@/components/ui/error-state';
import { paths } from '@/config/paths';
import { useMyDioceseDashboard } from '@/features/dashboard/api/get-diocese-dashboard';
import { DioceseStatsSection } from '@/features/dashboard/components/diocese-stats-section';
import { useClericalInbox } from '@/features/messaging/api/get-clerical-inbox';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { useAdminArticles } from '@/features/news/api/get-admin-articles';
import { cn } from '@/utils/cn';

import {
  TodayQueue,
  WorkEmpty,
  WorkHeader,
  WorkRowsSkeleton,
  WorkSection,
  type WorkTask,
} from './work-shell';

/** Nombre de lignes montrées avant de renvoyer vers la file complète. */
const PREVIEW_ROWS = 3;

interface DraftArticle {
  id: string;
  title: string;
  author_name: string;
}

// ── Messages ─────────────────────────────────────────────────────────────────

interface MessagesSectionProps {
  messages: ClergicalMessage[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function MessagesSection({
  messages,
  isLoading,
  isError,
  onRetry,
}: MessagesSectionProps) {
  const unread = messages.filter((m) => !m.read_at);
  const preview = (unread.length > 0 ? unread : messages).slice(0, PREVIEW_ROWS);

  return (
    <WorkSection
      title="Messages du clergé"
      count={unread.length}
      actionHref={paths.app.clerge.messages.getHref()}
    >
      {isError ? (
        <ErrorState
          title="Boîte de réception indisponible"
          description="Les messages n'ont pas pu être chargés."
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <WorkRowsSkeleton />
      ) : preview.length === 0 ? (
        <WorkEmpty>Aucun message.</WorkEmpty>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
          {preview.map((message) => (
            <li key={message.id}>
              <Link
                href={paths.app.clerge.messages.getHref()}
                className={cn(
                  'flex min-h-11 items-center gap-3 bg-card px-3 py-2.5 transition-colors hover:bg-muted/60 sm:px-4',
                  !message.read_at && 'border-l-4 border-info pl-2 sm:pl-3',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {message.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {message.sender_email}
                  </p>
                </div>
                {!message.read_at && (
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-info">
                    Non lu
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WorkSection>
  );
}

// ── Brouillons ───────────────────────────────────────────────────────────────

interface DraftsSectionProps {
  drafts: DraftArticle[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function DraftsSection({
  drafts,
  count,
  isLoading,
  isError,
  onRetry,
}: DraftsSectionProps) {
  return (
    <WorkSection
      title="Articles à publier"
      count={count}
      actionHref={paths.app.admin.articles.getHref()}
    >
      {isError ? (
        <ErrorState
          title="Brouillons indisponibles"
          description="La liste des articles n'a pas pu être chargée."
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <WorkRowsSkeleton />
      ) : drafts.length === 0 ? (
        <WorkEmpty>Aucun brouillon en attente.</WorkEmpty>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
          {drafts.map((article) => (
            <li key={article.id}>
              <Link
                href={paths.app.admin.articleEdit.getHref(article.id)}
                className="flex min-h-11 items-center gap-3 bg-card px-3 py-2.5 transition-colors hover:bg-muted/60 sm:px-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {article.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {article.author_name}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Écrire est l'acte propre de l'évêque : le chemin reste visible même
          quand la file est vide (R1 — l'action ne se cache pas dans un menu). */}
      <Link
        href={paths.app.admin.articleNew.getHref()}
        className="mt-2.5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <PlusCircle className="size-4" aria-hidden="true" />
        Nouvelle publication
      </Link>
    </WorkSection>
  );
}

// ── Écran ────────────────────────────────────────────────────────────────────

/**
 * Tableau de bord de l'évêque — archétype **Travail** (DIRECTION R6).
 *
 * Même parti pris que le curé : la charge d'abord, le décor jamais. Un évêque
 * pilote un diocèse — ce qu'il doit trancher (messages du clergé, articles à
 * publier, demandes de documents) passe avant les chiffres de consolidation,
 * qui sont du contexte.
 */
export function EvequeeDashboard() {
  const {
    data: inboxData,
    isLoading: loadingMessages,
    isError: messagesError,
    refetch: refetchMessages,
  } = useClericalInbox();
  const {
    data: draftsData,
    isLoading: loadingArticles,
    isError: articlesError,
    refetch: refetchArticles,
  } = useAdminArticles({ status: 'draft', limit: PREVIEW_ROWS });
  const { data: diocese } = useMyDioceseDashboard();

  const messages = inboxData?.results ?? [];
  const drafts = draftsData?.results ?? [];
  const unreadMessages = messages.filter((m) => !m.read_at).length;
  const draftCount = draftsData?.count ?? 0;

  const tasks: WorkTask[] = [
    {
      label: { one: 'message non lu', many: 'messages non lus' },
      count: messagesError ? 0 : unreadMessages,
      href: paths.app.clerge.messages.getHref(),
      isLoading: loadingMessages,
    },
    {
      label: { one: 'article à publier', many: 'articles à publier' },
      count: articlesError ? 0 : draftCount,
      href: paths.app.admin.articles.getHref(),
      isLoading: loadingArticles,
    },
    {
      label: { one: 'demande de document', many: 'demandes de documents' },
      count: diocese?.pending_documents ?? 0,
      href: paths.app.admin.documents.getHref(),
    },
  ];

  return (
    <ContentContainer>
      <div className="flex flex-col gap-7">
        <WorkHeader
          scope="Conduite du diocèse"
          title="Mon diocèse aujourd'hui"
          entity={diocese?.diocese.name}
        />

        <TodayQueue tasks={tasks} />

        <MessagesSection
          messages={messages}
          isLoading={loadingMessages}
          isError={messagesError}
          onRetry={() => refetchMessages()}
        />

        <DraftsSection
          drafts={drafts}
          count={draftCount}
          isLoading={loadingArticles}
          isError={articlesError}
          onRetry={() => refetchArticles()}
        />

        <DioceseStatsSection />
      </div>
    </ContentContainer>
  );
}
