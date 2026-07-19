'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { ErrorState } from '@/components/ui/error-state';
import { paths } from '@/config/paths';
import { useMyParishDashboard } from '@/features/dashboard/api/get-parish-dashboard';
import { ParishStatsSection } from '@/features/dashboard/components/parish-stats-section';
import type { MassIntention } from '@/features/intentions/api/get-my-intentions';
import { useParishIntentions } from '@/features/intentions/api/get-parish-intentions';
import {
  useAcceptIntention,
  useCelebrateIntention,
} from '@/features/intentions/api/manage-intentions';
import { useClericalInbox } from '@/features/messaging/api/get-clerical-inbox';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { PastoralReflectionComposer } from '@/features/reflexion-pastorale/components/pastoral-reflection-composer';
import { cn } from '@/utils/cn';

import {
  TodayQueue,
  WorkEmpty,
  WorkHeader,
  WorkRowsSkeleton,
  WorkSection,
  type WorkTask,
} from './work-shell';

/** Intentions sur lesquelles le curé a encore un acte à poser. */
const ACTIONABLE_STATUSES = ['pending', 'accepted', 'date_proposed'];

/** Nombre de lignes montrées avant de renvoyer vers la file complète. */
const PREVIEW_ROWS = 3;

// ── Intentions ───────────────────────────────────────────────────────────────

/**
 * Rangée d'intention : le texte, le demandeur, et **l'acte à poser** sur la
 * même ligne. L'ancienne carte « sacred » entourait la même information d'un
 * cadre doré et repoussait le bouton d'une ligne — sur une file traitée
 * plusieurs fois par jour, chaque pixel d'ornement est une friction.
 */
function IntentionRow({ intention }: { intention: MassIntention }) {
  const { mutate: accept, isPending: accepting } = useAcceptIntention();
  const { mutate: celebrate, isPending: celebrating } = useCelebrateIntention();

  const canAccept = intention.status === 'pending';
  const canCelebrate =
    intention.status === 'accepted' || intention.status === 'date_proposed';

  const actionClass =
    'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50';

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 border-primary/40 bg-card p-3 sm:pl-4">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {intention.intention_text}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {intention.requestor_email}
        </p>
      </div>

      {canAccept && (
        <button
          type="button"
          onClick={() => accept(intention.id)}
          disabled={accepting}
          className={cn(
            actionClass,
            'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          Accepter
        </button>
      )}
      {canCelebrate && (
        <button
          type="button"
          onClick={() => celebrate(intention.id)}
          disabled={celebrating}
          className={cn(
            actionClass,
            'border border-success/40 bg-success/10 text-success hover:bg-success/20',
          )}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Célébrée
        </button>
      )}
    </li>
  );
}

interface IntentionsSectionProps {
  intentions: MassIntention[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function IntentionsSection({
  intentions,
  isLoading,
  isError,
  onRetry,
}: IntentionsSectionProps) {
  const actionable = intentions.filter((i) =>
    ACTIONABLE_STATUSES.includes(i.status),
  );
  const preview = actionable.slice(0, PREVIEW_ROWS);

  return (
    <WorkSection
      title="Intentions de messe"
      count={actionable.length}
      actionHref={paths.app.clerge.intentions.getHref()}
    >
      {isError ? (
        <ErrorState
          title="Intentions indisponibles"
          description="La file des intentions n'a pas pu être chargée."
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <WorkRowsSkeleton />
      ) : preview.length === 0 ? (
        <WorkEmpty>Aucune intention en attente.</WorkEmpty>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
          {preview.map((intention) => (
            <IntentionRow key={intention.id} intention={intention} />
          ))}
        </ul>
      )}
    </WorkSection>
  );
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
                {/* Le libellé accompagne la pastille : la couleur seule ne
                    porte jamais l'information (WCAG 1.4.1, DIRECTION R4). */}
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

// ── Écran ────────────────────────────────────────────────────────────────────

/**
 * Tableau de bord du curé — archétype **Travail** (DIRECTION R6).
 *
 * Un curé n'ouvre pas cet écran pour être salué, il l'ouvre pour savoir **ce
 * qu'il doit faire aujourd'hui**. L'ordre de lecture suit donc l'usage :
 *
 * 1. **À traiter aujourd'hui** — le total d'actes en attente et un chemin
 *    direct vers chaque file (R1 : une action = un tap depuis l'accueil).
 * 2. **Les files elles-mêmes** — intentions puis messages, en rangées denses
 *    avec l'acte à poser sur la ligne.
 * 3. **Les chiffres de la paroisse** — du contexte, pas de l'action : ils
 *    passent donc après.
 * 4. **La réflexion pastorale** — un acte d'écriture, en fin de parcours.
 *
 * Les raccourcis colorés ont disparu : ils dupliquaient la navigation
 * principale en occupant l'espace de la charge de travail réelle.
 */
export function PretreeDashboard() {
  const {
    data: intentionsData,
    isLoading: loadingIntentions,
    isError: intentionsError,
    refetch: refetchIntentions,
  } = useParishIntentions();
  const {
    data: inboxData,
    isLoading: loadingMessages,
    isError: messagesError,
    refetch: refetchMessages,
  } = useClericalInbox();
  const { data: parish } = useMyParishDashboard();

  const intentions = intentionsData?.results ?? [];
  const messages = inboxData?.results ?? [];

  const pendingIntentions = intentions.filter(
    (i) => i.status === 'pending',
  ).length;
  const unreadMessages = messages.filter((m) => !m.read_at).length;

  const tasks: WorkTask[] = [
    {
      label: { one: 'intention à accepter', many: 'intentions à accepter' },
      count: intentionsError ? 0 : pendingIntentions,
      href: paths.app.clerge.intentions.getHref(),
      isLoading: loadingIntentions,
    },
    {
      label: { one: 'message non lu', many: 'messages non lus' },
      count: messagesError ? 0 : unreadMessages,
      href: paths.app.clerge.messages.getHref(),
      isLoading: loadingMessages,
    },
    {
      label: { one: 'demande de document', many: 'demandes de documents' },
      count: parish?.pending_documents ?? 0,
      href: paths.app.admin.documents.getHref(),
    },
  ];

  return (
    <ContentContainer>
      <div className="flex flex-col gap-7">
        <WorkHeader
          scope="Espace pastoral"
          title="Ma paroisse aujourd'hui"
          entity={parish?.parish.name}
        />

        <TodayQueue tasks={tasks} />

        <IntentionsSection
          intentions={intentions}
          isLoading={loadingIntentions}
          isError={intentionsError}
          onRetry={() => refetchIntentions()}
        />

        <MessagesSection
          messages={messages}
          isLoading={loadingMessages}
          isError={messagesError}
          onRetry={() => refetchMessages()}
        />

        <ParishStatsSection />

        <WorkSection title="Réflexion pastorale du jour">
          <PastoralReflectionComposer />
        </WorkSection>
      </div>
    </ContentContainer>
  );
}
