'use client';

import { FileText } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table/table';
import { cn } from '@/utils/cn';
import { formatFrDate } from '@/utils/format-date';

import { DocumentRequest } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

import {
  DocumentStatusActions,
  hasStatusActions,
} from './document-status-actions';
import { DocumentStatusBadge } from './document-status-badge';
import {
  compareByUrgency,
  getSlaState,
  SLA_ROW_ACCENT,
  SlaChip,
} from './sla-chip';

/** En-têtes de colonnes : discrets, la ligne porte l'information. */
const TH_CLASS =
  'px-4 text-[11px] uppercase tracking-wide text-muted-foreground';

/** Description humaine d'une demande, réutilisée par les libellés d'action. */
function describeRequest(doc: DocumentRequest): string {
  const type = formatDocumentType(doc.document_type, doc.document_type_free);
  return doc.requester_name ? `${type} de ${doc.requester_name}` : type;
}

/**
 * Requérant, référence, paroisse et date de réception réunis en une ligne.
 * Ces quatre informations occupaient trois lignes empilées et deux colonnes
 * dédiées : rassemblées, elles tiennent sur une ligne et libèrent la largeur
 * pour l'action principale.
 */
function describeContext(doc: DocumentRequest): string {
  return [
    doc.requester_name,
    doc.reference ? `Réf. ${doc.reference}` : null,
    doc.parish_name,
    `reçue le ${formatFrDate(doc.created_at, 'short')}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

interface RowProps {
  document: DocumentRequest;
}

/** Intitulé + contexte, identiques dans le tableau et sur mobile. */
function RequestSummary({ document: doc }: RowProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-foreground">
        {formatDocumentType(doc.document_type, doc.document_type_free)}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {describeContext(doc)}
      </p>
    </div>
  );
}

/**
 * Ligne mobile.
 *
 * La `DataTable` partagée retombe sur des paires libellé/valeur alignées à
 * droite : trois libellés répétés à chaque demande, et l'intitulé rejeté contre
 * le bord droit. C'est un repli correct pour une table de consultation, pas
 * pour une file traitée au téléphone plusieurs fois par jour. On compose donc
 * les primitives de table pour le desktop et une ligne dédiée pour le mobile —
 * la donnée seule, l'action principale sur toute la largeur.
 */
function QueueRow({ document: doc }: RowProps) {
  const sla = getSlaState(doc);

  return (
    <li
      className={cn(
        'rounded-lg border border-l-4 border-border bg-card p-3 shadow-soft-sm',
        SLA_ROW_ACCENT[sla.kind],
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <SlaChip document={doc} />
        <DocumentStatusBadge status={doc.status} />
      </div>

      <div className="mt-1.5">
        <RequestSummary document={doc} />
      </div>

      {hasStatusActions(doc.status) && (
        <div className="mt-2">
          <DocumentStatusActions
            requestId={doc.id}
            status={doc.status}
            subject={describeRequest(doc)}
            fullWidthPrimary
          />
        </div>
      )}
    </li>
  );
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
 *
 * Chargement et file vide sont traités en amont de la bascule desktop/mobile :
 * un seul état affiché, quelle que soit la largeur.
 */
export function AdminDocumentList({
  documents,
  isLoading,
}: AdminDocumentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText />}
        title="Aucune demande à traiter"
        description="Les nouvelles demandes des fidèles apparaîtront ici dès leur soumission. Revenez régulièrement pour tenir les délais."
      />
    );
  }

  const ordered = [...documents].sort((a, b) => compareByUrgency(a, b));

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <TableElement>
          <caption className="sr-only">
            Demandes de documents à traiter, triées par urgence (les plus
            anciennes d’abord)
          </caption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead scope="col" className={TH_CLASS}>
                Délai
              </TableHead>
              <TableHead scope="col" className={TH_CLASS}>
                Demande
              </TableHead>
              <TableHead scope="col" className={TH_CLASS}>
                Statut
              </TableHead>
              <TableHead scope="col" className={cn(TH_CLASS, 'text-right')}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="px-4 py-2">
                  <SlaChip document={doc} />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <RequestSummary document={doc} />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <DocumentStatusBadge status={doc.status} />
                </TableCell>
                <TableCell className="px-4 py-2 text-right">
                  <DocumentStatusActions
                    requestId={doc.id}
                    status={doc.status}
                    subject={describeRequest(doc)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      </div>

      <ul className="space-y-2 md:hidden">
        {ordered.map((doc) => (
          <QueueRow key={doc.id} document={doc} />
        ))}
      </ul>
    </>
  );
}
