'use client';

import {
  ArrowLeft,
  FileDown,
  FileSearch,
  Loader2,
  Paperclip,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  StatusTimeline,
  type TimelineStep,
} from '@/components/ui/status-timeline';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-client';
import { formatFrDate } from '@/utils/format-date';

import { useDocumentRequest } from '../api/get-document';
import { useSubmitSupplement } from '../api/submit-supplement';
import { DocumentRequestDetail, DocumentStatus } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

import {
  DOCUMENT_STATUS_CONFIG,
  DocumentStatusBadge,
} from './document-status-badge';
import { NOMINAL_PATH, TERMINAL_STATUSES, TrackingHero } from './tracking-hero';

interface DocumentDetailProps {
  documentId: string;
}

/**
 * Acteur générique de chaque étape franchie. Le backend ne renvoie pas encore
 * d'acteur dans `status_logs` (cf. PLAN_documents §6.1) : on affiche le **rôle**
 * déduit du statut, jamais une identité. Ces libellés sont propres à la feature
 * documents — le composant partagé `StatusTimeline` n'en connaît aucun.
 */
const STEP_ACTOR: Record<DocumentStatus, string> = {
  submitted: 'Par vous — reçue par votre paroisse',
  under_verification: 'Par le secrétariat paroissial (niveau 1)',
  info_requested: 'Demandé par le secrétariat paroissial',
  validated: 'Par le curé (niveau 2)',
  document_deposited: 'Par le curé — déposé dans votre coffre-fort',
  rejected: 'Décision de la paroisse',
};

/**
 * Étapes à venir : le fidèle doit comprendre le circuit ecclésial qui reste à
 * parcourir, pas seulement lire un statut technique.
 */
const UPCOMING_STEP: Partial<
  Record<DocumentStatus, { label: string; actor: string }>
> = {
  validated: {
    label: 'Validation et signature du curé',
    actor: 'Niveau 2 — signature de l’autorité paroissiale',
  },
  document_deposited: {
    label: 'Dépôt dans votre coffre-fort',
    actor: 'Document téléchargeable, conservé à vie',
  },
};

/**
 * Construit le suivi complet : étapes franchies (historique, la dernière étant
 * la courante) + étapes restantes du chemin nominal en « à venir ». Après un
 * complément demandé, la vérification reprend — libellé dédié pour la
 * distinguer de la première passe. `nodeContent` est greffé sur l'étape
 * courante : la branche `info_requested` se traite à son nœud.
 */
function buildTimelineSteps(
  data: DocumentRequestDetail,
  nodeContent?: React.ReactNode,
): TimelineStep[] {
  const logs = data.status_logs ?? [];

  const past: TimelineStep[] =
    logs.length > 0
      ? logs.map((log, idx, arr): TimelineStep => {
          const cfg = DOCUMENT_STATUS_CONFIG[log.to_status];
          const isCurrent = idx === arr.length - 1;
          // Une reprise de vérification qui suit une demande d'info a été
          // déclenchée par la réponse du fidèle : l'acteur, c'est lui.
          const isResumption =
            log.to_status === 'under_verification' &&
            arr[idx - 1]?.to_status === 'info_requested';
          // Le message de la paroisse est CITÉ au nœud « Infos requises »
          // (pas relégué en simple description grise).
          const isRequest = log.to_status === 'info_requested';
          const quote =
            isRequest && log.comment ? (
              <ParishRequestQuote comment={log.comment} />
            ) : null;
          const nodeSlot = isCurrent ? nodeContent : null;
          return {
            label: isResumption ? 'Reprise de la vérification' : cfg.label,
            tone: cfg.tone,
            state: isCurrent ? 'current' : 'done',
            timestamp: formatFrDate(log.created_at, 'datetime'),
            actor: isResumption
              ? 'Par vous — précisions transmises à la paroisse'
              : STEP_ACTOR[log.to_status],
            description: isRequest ? undefined : log.comment || undefined,
            content:
              quote || nodeSlot ? (
                <>
                  {quote}
                  {nodeSlot}
                </>
              ) : undefined,
          };
        })
      : [
          {
            label: DOCUMENT_STATUS_CONFIG[data.status].label,
            tone: DOCUMENT_STATUS_CONFIG[data.status].tone,
            state: 'current',
            timestamp: formatFrDate(data.created_at, 'datetime'),
            actor: STEP_ACTOR[data.status],
            content: nodeContent,
          },
        ];

  if (TERMINAL_STATUSES.includes(data.status)) return past;

  const currentIdx = NOMINAL_PATH.indexOf(data.status);
  const upcomingStatuses =
    currentIdx === -1
      ? NOMINAL_PATH.slice(1) // info_requested → la vérification reprend
      : NOMINAL_PATH.slice(currentIdx + 1);

  const upcoming: TimelineStep[] = upcomingStatuses.map(
    (status): TimelineStep => {
      const cfg = DOCUMENT_STATUS_CONFIG[status];
      const narrative = UPCOMING_STEP[status];
      return {
        label:
          data.status === 'info_requested' && status === 'under_verification'
            ? 'Reprise de la vérification'
            : (narrative?.label ?? cfg.label),
        tone: cfg.tone,
        state: 'upcoming',
        actor: narrative?.actor,
      };
    },
  );

  return [...past, ...upcoming];
}

function BackToDocumentsLink() {
  return (
    <Link
      href={paths.app.documents.getHref()}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Documents
    </Link>
  );
}

function DocumentDetailSkeleton() {
  return (
    <ContentContainer>
      <Skeleton className="mb-4 h-4 w-24" />
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </ContentContainer>
  );
}

/** Message de la paroisse, cité au nœud « Infos requises » de la timeline. */
function ParishRequestQuote({ comment }: { comment: string }) {
  return (
    <blockquote className="mt-2 rounded-e-xl border-s-2 border-accent bg-accent/5 px-3 py-2 text-sm italic text-foreground/85">
      <span aria-hidden="true">« </span>
      <span>{comment}</span>
      <span aria-hidden="true"> »</span>
    </blockquote>
  );
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
  const { data, isLoading, isError, error, refetch } =
    useDocumentRequest(documentId);
  const [supplement, setSupplement] = useState('');
  const [submittedSupplement, setSubmittedSupplement] = useState(false);

  const { mutate: submitSupplement, isPending: isSubmitting } =
    useSubmitSupplement(documentId);

  useRegisterPageMeta({
    title: data
      ? formatDocumentType(data.document_type, data.document_type_free)
      : 'Demande de document',
    leafLabel: 'Détail de la demande',
    showHeading: false,
    backHref: paths.app.documents.getHref(),
  });

  function handleSupplementSubmit(e: React.FormEvent) {
    e.preventDefault();
    const notes = supplement.trim();
    if (!notes) return;
    submitSupplement(
      { additional_info: notes },
      {
        onSuccess: () => {
          setSupplement('');
          setSubmittedSupplement(true);
        },
      },
    );
  }

  if (isLoading) return <DocumentDetailSkeleton />;

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <ContentContainer>
        <BackToDocumentsLink />
        {notFound ? (
          <EmptyState
            icon={<FileSearch aria-hidden="true" />}
            title="Demande introuvable"
            description="Cette demande n'existe pas ou n'est plus accessible. Retrouvez toutes vos démarches depuis votre espace Documents."
            action={
              <Link
                href={paths.app.documents.getHref()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none"
              >
                Retour à mes documents
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="Impossible de charger cette demande"
            description="Vérifiez votre connexion puis réessayez."
            onRetry={() => refetch()}
          />
        )}
      </ContentContainer>
    );
  }

  if (!data) return null;

  // Réponse au nœud : le formulaire vit sous la citation de la paroisse.
  const supplementNode =
    data.status === 'info_requested' ? (
      <>
        {submittedSupplement ? (
          <p
            className="mt-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            role="status"
          >
            Vos informations ont été envoyées à la paroisse.
          </p>
        ) : (
          <form onSubmit={handleSupplementSubmit} className="mt-2">
            <label htmlFor="supplement-input" className="sr-only">
              Informations complémentaires demandées
            </label>
            <textarea
              id="supplement-input"
              value={supplement}
              onChange={(e) => setSupplement(e.target.value)}
              rows={3}
              placeholder="Apportez les précisions demandées…"
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!supplement.trim() || isSubmitting}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              {isSubmitting ? 'Envoi en cours…' : 'Envoyer le complément'}
            </button>
          </form>
        )}
      </>
    ) : undefined;

  return (
    <ContentContainer>
      <BackToDocumentsLink />

      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardEyebrow className="text-gold-ink">
                Type de document
              </CardEyebrow>
              <h1 className="mt-1.5 font-serif text-2xl font-bold leading-tight tracking-tight text-foreground">
                {formatDocumentType(data.document_type, data.document_type_free)}
              </h1>
              {data.reference && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Réf. {data.reference}
                </p>
              )}
            </div>
            <DocumentStatusBadge status={data.status} />
          </div>
          <div className="hairline-gold mt-3" aria-hidden="true" />
        </div>

        {/* Héros d'état courant : la réponse à « où en est ma demande ? ». */}
        <TrackingHero document={data} />

        {/* Le suivi remonte juste après le héros : c'est le cœur de la page. */}
        <section aria-label="Historique de la démarche">
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">
            Historique de la démarche
          </h2>
          <StatusTimeline
            aria-label="Historique de la démarche"
            animateCurrent
            steps={buildTimelineSteps(data, supplementNode)}
          />
        </section>

        <Card variant="sacred" className="p-4">
          <CardEyebrow>Date de la demande</CardEyebrow>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatFrDate(data.created_at)}
          </p>
          {data.parish_name && (
            <>
              <CardEyebrow className="mt-3">Paroisse</CardEyebrow>
              <p className="mt-1 text-sm text-foreground">{data.parish_name}</p>
            </>
          )}
          {data.notes && (
            <>
              <CardEyebrow className="mt-3">Précisions</CardEyebrow>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {data.notes}
              </p>
            </>
          )}
        </Card>

        {data.attachments && data.attachments.length > 0 && (
          <section aria-label="Pièces jointes">
            <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-foreground">
              <Paperclip className="size-4 text-accent" aria-hidden="true" />
              Pièces jointes
            </h2>
            <ul className="flex flex-col gap-2">
              {data.attachments.map((att) => (
                <li
                  key={att.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-secondary/60 px-4 py-3 shadow-soft-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {att.label ?? att.file_name ?? 'Pièce jointe'}
                    </p>
                    {att.attachment_type_label && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {att.attachment_type_label}
                      </p>
                    )}
                  </div>
                  {att.file_url && (
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <FileDown className="size-3.5" aria-hidden="true" />
                      Télécharger
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </ContentContainer>
  );
}
