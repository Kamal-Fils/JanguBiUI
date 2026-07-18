'use client';

import { ChevronRight, Church, FileDown, PenLine, Share2 } from 'lucide-react';
import Link from 'next/link';

import { paths } from '@/config/paths';
import { formatFrDate } from '@/utils/format-date';

import { DocumentRequest } from '../types';
import { formatDocumentType } from '../utils/format-document-type';

/**
 * Accord en genre du participe (« Délivré » / « Délivrée ») d'après le libellé
 * du type : « Certificat … » est masculin, « Attestation … » féminin. Dérivé du
 * libellé plutôt que codé par type pour rester juste si la liste s'allonge.
 */
function feminineSuffix(typeLabel: string): string {
  return typeLabel.trim().toLowerCase().startsWith('attestation') ? 'e' : '';
}

const ACTION_CLASS =
  'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface VaultCardProps {
  document: DocumentRequest;
  /**
   * URL du document final, résolue par le parent (la liste ne porte pas les
   * pièces jointes). Absente tant qu'elle n'est pas connue.
   */
  downloadUrl?: string;
  /** Résolution de `downloadUrl` en cours — réserve la place du bouton. */
  isResolvingDownload?: boolean;
}

/**
 * Carte-certificat du coffre-fort : un document délivré n'est pas une ligne de
 * liste mais un acte que l'on conserve. Double cadre or, sceau, grain papier,
 * référence officielle, et le vocabulaire du document acquis (« Délivré à »,
 * « Déposé le ») plutôt que celui de la demande.
 */
export function VaultCard({
  document: doc,
  downloadUrl,
  isResolvingDownload = false,
}: VaultCardProps) {
  const typeLabel = formatDocumentType(doc.document_type);
  const e = feminineSuffix(typeLabel);
  const depositedAt = doc.updated_at ?? doc.created_at;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-gold/45 bg-card shadow-soft-sm transition-shadow duration-[var(--duration-normal)] ease-out-soft hover:shadow-soft">
      {/* Second filet or intérieur — purement décoratif. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-1.5 rounded-xl border border-gold/25"
      />

      <div className="bg-paper relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-gold/55 bg-accent/15 font-serif text-base text-gold-ink"
          >
            ✠
          </span>
          {doc.reference && (
            <span className="rounded-full border border-gold/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-gold-ink">
              Réf. {doc.reference}
            </span>
          )}
        </div>

        <h3 className="mt-2.5 font-serif text-base font-bold leading-tight tracking-tight text-foreground">
          {typeLabel}
        </h3>

        {doc.requester_name && (
          <p className="mt-1 text-xs text-muted-foreground">
            Délivré{e} à{' '}
            <span className="font-medium text-foreground">
              {doc.requester_name}
            </span>
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {doc.parish_name && (
            <span className="inline-flex items-center gap-1.5">
              <Church className="size-3.5 shrink-0" aria-hidden="true" />
              {doc.parish_name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <PenLine className="size-3.5 shrink-0" aria-hidden="true" />
            Déposé{e} le {formatFrDate(depositedAt)}
          </span>
        </div>

        <hr className="hairline-gold my-3" aria-hidden="true" />

        <div className="flex flex-wrap items-center gap-2">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Télécharger — ${typeLabel}`}
              className={`${ACTION_CLASS} bg-primary text-primary-foreground hover:bg-primary/90`}
            >
              <FileDown className="size-3.5" aria-hidden="true" />
              Télécharger
            </a>
          ) : (
            isResolvingDownload && (
              // Réserve la place du bouton pendant la résolution, sans annoncer
              // aux lecteurs d'écran une action qui n'existe pas encore.
              <span
                aria-hidden="true"
                className={`${ACTION_CLASS} bg-primary/40 text-primary-foreground opacity-60`}
              >
                <FileDown className="size-3.5" />
                Télécharger
              </span>
            )
          )}

          <button
            type="button"
            disabled
            aria-disabled="true"
            className={`${ACTION_CLASS} cursor-not-allowed border border-border bg-card text-muted-foreground`}
          >
            <Share2 className="size-3.5" aria-hidden="true" />
            Partager
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              Bientôt
            </span>
          </button>

          <Link
            href={paths.app.document.getHref(doc.id)}
            aria-label={`Voir la démarche — ${typeLabel}`}
            className="ml-auto inline-flex items-center gap-0.5 rounded-lg text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Voir la démarche
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
