'use client';

import { Spinner } from '@/components/ui/spinner';

import { DocumentRequest } from '../types';

import { DocumentStatusActions } from './document-status-actions';
import { DocumentStatusBadge } from './document-status-badge';

const DOC_TYPE_LABELS: Record<string, string> = {
  baptism: 'Baptême',
  confirmation: 'Confirmation',
  marriage: 'Mariage',
  death: 'Décès',
  communion: 'Première communion',
  ordination: 'Ordination',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface AdminDocumentListProps {
  documents: DocumentRequest[];
  isLoading?: boolean;
}

export function AdminDocumentList({
  documents,
  isLoading,
}: AdminDocumentListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aucune demande de document.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">
                  {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                </span>
                <DocumentStatusBadge status={doc.status} />
              </div>
              {doc.requester_name && (
                <p className="text-sm text-muted-foreground">
                  Requérant : {doc.requester_name}
                </p>
              )}
              {doc.parish_name && (
                <p className="text-xs text-muted-foreground">
                  Paroisse : {doc.parish_name}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(doc.created_at)}
              </p>
            </div>
            <DocumentStatusActions requestId={doc.id} status={doc.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
