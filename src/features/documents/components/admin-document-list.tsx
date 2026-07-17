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

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

interface AdminDocumentListProps {
  documents: DocumentRequest[];
  isLoading?: boolean;
}

export function AdminDocumentList({
  documents,
  isLoading,
}: AdminDocumentListProps) {
  const columns: DataTableColumn<DocumentRequest>[] = [
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
      mobileLabel: 'Reçue le',
      headClassName: TH_CLASS,
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
          ariaLabel={`Actions pour ${formatDocumentType(doc.document_type)}${
            doc.requester_name ? ` de ${doc.requester_name}` : ''
          }`}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={documents}
      columns={columns}
      rowKey={(doc) => doc.id}
      isLoading={isLoading}
      caption="Demandes de documents à traiter"
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
