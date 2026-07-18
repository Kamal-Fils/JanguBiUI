'use client';

import { ShieldCheck } from 'lucide-react';

import { CardEyebrow } from '@/components/ui/card/card';
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
    <li className="rounded-xl border border-accent/45 bg-gradient-to-br from-accent/8 to-card p-4 shadow-soft-sm">
      <div className="flex gap-3">
        {/* Vignette « acte » : évoque le document à signer. */}
        <span
          aria-hidden="true"
          className="flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-accent/40 bg-card text-gold-ink"
        >
          <span className="text-sm leading-none">✠</span>
          <span className="h-0.5 w-6 rounded-full bg-muted" />
          <span className="h-0.5 w-6 rounded-full bg-muted" />
          <span className="h-0.5 w-4 rounded-full bg-muted" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-bold text-foreground">
            {type}
            {doc.requester_name ? ` — ${doc.requester_name}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vérifiée par le secrétariat paroissial · reçue le{' '}
            {formatFrDate(doc.created_at, 'short')}
            {doc.reference ? ` · Réf. ${doc.reference}` : ''}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-success">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Concordance au registre vérifiée (niveau 1)
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SlaChip status={doc.status} createdAt={doc.created_at} />
            <div className="ml-auto">
              <DocumentStatusActions
                requestId={doc.id}
                status={doc.status}
                subject={subject}
              />
            </div>
          </div>
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
      className="mb-5 rounded-2xl border border-accent/40 bg-card p-4 shadow-soft-sm sm:p-5"
    >
      <CardEyebrow className="text-gold-ink">
        Niveau 2 — acte du curé
      </CardEyebrow>
      <h2
        id="signature-panel-title"
        className="mt-1 font-serif text-lg font-bold leading-tight text-foreground"
      >
        Signature du curé
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {awaiting.length === 1
          ? 'Une demande a passé la vérification et attend votre signature.'
          : `${awaiting.length} demandes ont passé la vérification et attendent votre signature.`}
      </p>
      <hr className="hairline-gold my-3" />
      <ul className="space-y-3">
        {awaiting.map((doc) => (
          <SignatureItem key={doc.id} document={doc} />
        ))}
      </ul>
    </section>
  );
}
