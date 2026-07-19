'use client';

import { ShieldCheck } from 'lucide-react';

import { formatFrDate } from '@/utils/format-date';

import { DocumentRequest } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

import { DocumentStatusActions } from './document-status-actions';
import { SlaChip } from './sla-chip';

/**
 * Le front ne distingue PAS niveau 1 (diacre / admin paroissial) de niveau 2
 * (curé) : l'accès est gardé par le seul `canProcessDocuments`, et l'API ne
 * porte aucune distinction d'acteur sur les transitions (PLAN_documents §6.5).
 *
 * Le panneau est donc piloté par le **statut** : une demande `validated` a
 * franchi la vérification niveau 1 et n'attend plus que la signature. Le jour
 * où le backend distinguera formellement les acteurs, il suffira d'ajouter la
 * garde de rôle ici — la sélection par statut reste juste.
 */
function isAwaitingSignature(document: DocumentRequest): boolean {
  return document.status === 'validated';
}

interface SignatureItemProps {
  document: DocumentRequest;
}

function SignatureItem({ document: doc }: SignatureItemProps) {
  const type = formatDocumentType(doc.document_type);
  const subject = doc.requester_name
    ? `${type} de ${doc.requester_name}`
    : type;

  return (
    <li className="rounded-lg border border-accent/45 bg-card p-3">
      <p className="text-sm font-semibold leading-snug text-foreground">
        {type}
        {doc.requester_name ? ` — ${doc.requester_name}` : ''}
      </p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
        {doc.reference ? `Réf. ${doc.reference} · ` : ''}reçue le{' '}
        {formatFrDate(doc.created_at, 'short')}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-success">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Concordance au registre vérifiée (niveau 1)
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SlaChip document={doc} />
        <div className="ml-auto">
          <DocumentStatusActions
            requestId={doc.id}
            status={doc.status}
            subject={subject}
          />
        </div>
      </div>
    </li>
  );
}

interface SignaturePanelProps {
  documents: DocumentRequest[];
}

/**
 * Signature du curé (niveau 2) mise en scène : la validation finale redevient
 * un acte d'autorité, pas un item de menu. La transition backend est inchangée
 * (`deposit`) — seule sa présentation change.
 */
export function SignaturePanel({ documents }: SignaturePanelProps) {
  const awaiting = documents.filter(isAwaitingSignature);

  if (awaiting.length === 0) return null;

  return (
    <section
      aria-labelledby="signature-panel-title"
      className="mb-4 rounded-xl border border-accent/50 bg-accent/5 p-3 sm:p-4"
    >
      <h2
        id="signature-panel-title"
        className="text-base font-bold leading-tight text-gold-ink"
      >
        Signature du curé
      </h2>
      <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
        {awaiting.length === 1
          ? 'Une demande a passé la vérification et attend votre signature.'
          : `${awaiting.length} demandes ont passé la vérification et attendent votre signature.`}
      </p>
      <ul className="space-y-2">
        {awaiting.map((doc) => (
          <SignatureItem key={doc.id} document={doc} />
        ))}
      </ul>
    </section>
  );
}
