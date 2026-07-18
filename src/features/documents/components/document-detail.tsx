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

interface DocumentDetailProps {
  documentId: string;
}

/**
 * Chemin nominal du workflow. Les branches (`info_requested`, `rejected`)
 * apparaissent via l'historique immuable renvoyé par le back (status_logs).
 */
const NOMINAL_PATH: DocumentStatus[] = [
  'submitted',
  'under_verification',
  'validated',
  'document_deposited',
];

/** Statuts terminaux : plus aucune étape à venir dans le suivi. */
const TERMINAL_STATUSES: DocumentStatus[] = ['document_deposited', 'rejected'];

/**
 * Construit le suivi complet : étapes franchies (historique, la dernière étant
 * la courante) + étapes restantes du chemin nominal en « à venir ». Après un
 * complément demandé, la vérification reprend — libellé dédié pour la
 * distinguer de la première passe.
 */
function buildTimelineSteps(data: DocumentRequestDetail): TimelineStep[] {
  const logs = data.status_logs ?? [];

  const past: TimelineStep[] =
    logs.length > 0
      ? logs.map((log, idx, arr): TimelineStep => {
          const cfg = DOCUMENT_STATUS_CONFIG[log.to_status];
          return {
            label: cfg.label,
            tone: cfg.tone,
            state: idx === arr.length - 1 ? 'current' : 'done',
            timestamp: formatFrDate(log.created_at, 'datetime'),
            description: log.comment || undefined,
          };
        })
      : [
          {
            label: DOCUMENT_STATUS_CONFIG[data.status].label,
            tone: DOCUMENT_STATUS_CONFIG[data.status].tone,
            state: 'current',
            timestamp: formatFrDate(data.created_at, 'datetime'),
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
      return {
        label:
          data.status === 'info_requested' && status === 'under_verification'
            ? 'Reprise de la vérification'
            : cfg.label,
        tone: cfg.tone,
        state: 'upcoming',
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

export function DocumentDetail({ documentId }: DocumentDetailProps) {
  const { data, isLoading, isError, error, refetch } =
    useDocumentRequest(documentId);
  const [supplement, setSupplement] = useState('');
  const [submittedSupplement, setSubmittedSupplement] = useState(false);

  const { mutate: submitSupplement, isPending: isSubmitting } =
    useSubmitSupplement(documentId);

  useRegisterPageMeta({
    title: data
      ? formatDocumentType(data.document_type)
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
                {formatDocumentType(data.document_type)}
              </h1>
              {data.reference_number && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Réf. {data.reference_number}
                </p>
              )}
            </div>
            <DocumentStatusBadge status={data.status} />
          </div>
          <div className="hairline-gold mt-3" aria-hidden="true" />
        </div>

        {data.status === 'rejected' && data.rejection_reason && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
              Motif du rejet
            </p>
            <p className="mt-1 text-sm text-destructive/80">
              {data.rejection_reason}
            </p>
          </div>
        )}

        {data.status === 'document_deposited' && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3">
            <p className="text-sm font-semibold text-success">
              Document déposé
            </p>
            <p className="mt-1 text-sm text-success/80">
              Votre document est disponible : téléchargez-le depuis les pièces
              jointes ci-dessous, ou retrouvez-le à tout moment dans votre
              coffre-fort numérique.
            </p>
          </div>
        )}

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

        {data.status === 'info_requested' && !submittedSupplement && (
          <form
            onSubmit={handleSupplementSubmit}
            className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                Informations complémentaires demandées
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Votre paroisse demande des précisions pour traiter votre
                demande.
              </p>
            </div>
            <label htmlFor="supplement-input" className="sr-only">
              Informations complémentaires
            </label>
            <textarea
              id="supplement-input"
              value={supplement}
              onChange={(e) => setSupplement(e.target.value)}
              rows={4}
              placeholder="Apportez les précisions demandées…"
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!supplement.trim() || isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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

        {submittedSupplement && (
          <div
            className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            role="status"
          >
            Vos informations ont été envoyées à la paroisse.
          </div>
        )}

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

        <section aria-label="Suivi de la demande">
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">
            Suivi de la demande
          </h2>
          <StatusTimeline
            aria-label="Suivi de la demande"
            steps={buildTimelineSteps(data)}
          />
        </section>
      </div>
    </ContentContainer>
  );
}
