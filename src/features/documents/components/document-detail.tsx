'use client';

import { ArrowLeft, FileDown, Loader2, Paperclip, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import {
  StatusTimeline,
  type TimelineStep,
} from '@/components/ui/status-timeline';

import { useDocumentRequest } from '../api/get-document';
import { useSubmitSupplement } from '../api/submit-supplement';
import { formatDocumentType } from '../utils/format-document-type';

import {
  DOCUMENT_STATUS_CONFIG,
  DocumentStatusBadge,
} from './document-status-badge';

interface DocumentDetailProps {
  documentId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useDocumentRequest(documentId);
  const [supplement, setSupplement] = useState('');
  const [submittedSupplement, setSubmittedSupplement] = useState(false);

  const { mutate: submitSupplement, isPending: isSubmitting } =
    useSubmitSupplement(documentId);

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

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          Détail de la demande
        </span>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {isError && (
          <p className="py-10 text-center text-sm text-destructive">
            Impossible de charger cette demande.
          </p>
        )}

        {!isLoading && !isError && data && (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Type de document
                </p>
                <h1 className="mt-1 text-xl font-semibold text-foreground">
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

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date de la demande
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDate(data.created_at)}
              </p>
              {data.parish_name && (
                <>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Paroisse
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {data.parish_name}
                  </p>
                </>
              )}
              {data.notes && (
                <>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Précisions
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {data.notes}
                  </p>
                </>
              )}
            </div>

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
                <textarea
                  value={supplement}
                  onChange={(e) => setSupplement(e.target.value)}
                  rows={4}
                  placeholder="Apportez les précisions demandées…"
                  className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!supplement.trim() || isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {isSubmitting ? 'Envoi en cours…' : 'Envoyer le complément'}
                </button>
              </form>
            )}

            {submittedSupplement && (
              <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                Vos informations ont été envoyées à la paroisse.
              </div>
            )}

            {data.attachments && data.attachments.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Paperclip className="size-4" />
                  Pièces jointes
                </h2>
                <ul className="flex flex-col gap-2">
                  {data.attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
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
                          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          <FileDown className="size-3.5" />
                          Télécharger
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.status_logs && data.status_logs.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  Historique
                </h2>
                <StatusTimeline
                  steps={data.status_logs.map((log, idx, arr): TimelineStep => {
                    const cfg = DOCUMENT_STATUS_CONFIG[log.to_status];
                    return {
                      label: cfg.label,
                      tone: cfg.tone,
                      state: idx === arr.length - 1 ? 'current' : 'done',
                      timestamp: formatDateTime(log.created_at),
                      description: log.comment || undefined,
                    };
                  })}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
