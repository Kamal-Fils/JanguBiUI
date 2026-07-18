import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { paths } from '@/config/paths';

import { DocumentRequest } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

const CTA_CLASS =
  'inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground shadow-soft-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none';

/** Phrase d'attente — la paroisse est nommée quand l'API la renvoie. */
function waitingSentence(parishName: string | null | undefined): string {
  const who = parishName ?? 'Votre paroisse';
  return `${who} attend des précisions pour poursuivre la vérification.`;
}

interface ActionRequiredCardProps {
  /** Demandes en `info_requested` — celles qui attendent le fidèle. */
  documents: DocumentRequest[];
}

/**
 * Carte « Action requise », en tête du hub. Une demande `info_requested`
 * n'attend pas la paroisse mais le *fidèle* : elle sort du flux de la liste et
 * porte son propre appel à l'action vers le suivi, où la réponse se saisit.
 */
export function ActionRequiredCard({ documents }: ActionRequiredCardProps) {
  if (documents.length === 0) return null;

  const isSingle = documents.length === 1;

  return (
    <section
      aria-labelledby="documents-action-required"
      className="rounded-2xl border border-accent/45 bg-accent/10 p-4 shadow-soft-sm"
    >
      <p
        id="documents-action-required"
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-gold-ink"
      >
        <AlertTriangle className="size-3.5" aria-hidden="true" />
        Action requise
      </p>

      {isSingle ? (
        <>
          <h3 className="mt-1.5 font-serif text-base font-bold leading-tight text-foreground">
            {formatDocumentType(documents[0].document_type)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {waitingSentence(documents[0].parish_name)}
          </p>
          <Link
            href={paths.app.document.getHref(documents[0].id)}
            className={`${CTA_CLASS} mt-3`}
          >
            Répondre à la paroisse
          </Link>
        </>
      ) : (
        <>
          <h3 className="mt-1.5 font-serif text-base font-bold leading-tight text-foreground">
            {documents.length} demandes attendent votre réponse
          </h3>
          <ul className="mt-2 flex flex-col">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={paths.app.document.getHref(doc.id)}
                  className="group flex items-center gap-2 border-b border-accent/25 py-2.5 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {formatDocumentType(doc.document_type)}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-gold-ink">
                    Répondre
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-gold-ink/70 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
