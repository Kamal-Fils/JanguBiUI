'use client';

import { FileText } from 'lucide-react';

import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { DocumentRequest } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

import { DocumentStatusActions } from './document-status-actions';
import { DocumentStatusBadge } from './document-status-badge';
import { compareByUrgency, SlaChip } from './sla-chip';

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

/** Description humaine d'une demande, réutilisée par les libellés d'action. */
function describeRequest(doc: DocumentRequest): string {
  const type = formatDocumentType(doc.document_type);
  return doc.requester_name ? `${type} de ${doc.requester_name}` : type;
}

interface AdminDocumentListProps {
  documents: DocumentRequest[];
  isLoading?: boolean;
}

/**
 * File de traitement paroissiale : liste **priorisée par SLA** (et non kanban —
 * justification PLAN_documents §2.5). L'ordre est l'urgence : ce que la
 * paroisse doit traiter d'abord, du plus ancien au plus récent ; les demandes
 * en attente du fidèle puis les demandes clôturées ferment la marche.
 */
export function AdminDocumentList({
  documents,
  isLoading,
}: AdminDocumentListProps) {
  const ordered = [...documents].sort((a, b) => compareByUrgency(a, b));

  const columns: DataTableColumn<DocumentRequest>[] = [
    {
      header: 'Délai',
      mobileLabel: 'Délai',
      headClassName: TH_CLASS,
      cell: (doc) => <SlaChip status={doc.status} createdAt={doc.created_at} />,
    },
    {
      header: 'Demande',
      mobileLabel: 'Demande',
      headClassName: TH_CLASS,
      cell: (doc) => (
        <div className="min-w-0">
          <p className="line-clamp-1 font-serif text-sm font-semibold text-foreground">
            {formatDocumentType(doc.document_type)}
          </p>
          {doc.requester_name && (
            <p className="truncate text-xs text-muted-foreground">
              par {doc.requester_name}
            </p>
          )}
          {doc.reference && (
            <p className="mt-0.5 truncate text-[11px] tabular-nums text-muted-foreground">
              Réf. {doc.reference}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Paroisse',
      headClassName: TH_CLASS,
      hideOnMobile: true,
      cell: (doc) =>
        doc.parish_name ? (
          <span className="text-sm text-muted-foreground">
            {doc.parish_name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: 'Statut',
      headClassName: TH_CLASS,
      cell: (doc) => <DocumentStatusBadge status={doc.status} />,
    },
    {
      header: 'Reçue le',
      headClassName: TH_CLASS,
      hideOnMobile: true,
      cell: (doc) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatFrDate(doc.created_at, 'short')}
        </span>
      ),
    },
    {
      header: 'Actions',
      isAction: true,
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (doc) => (
        <DocumentStatusActions
          requestId={doc.id}
          status={doc.status}
          subject={describeRequest(doc)}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={ordered}
      columns={columns}
      rowKey={(doc) => doc.id}
      isLoading={isLoading}
      caption="Demandes de documents à traiter, triées par urgence (les plus anciennes d’abord)"
      emptyState={
        <EmptyState
          icon={<FileText />}
          title="Aucune demande à traiter"
          description="Les nouvelles demandes des fidèles apparaîtront ici dès leur soumission. Revenez régulièrement pour tenir les délais."
        />
      }
    />
  );
}
