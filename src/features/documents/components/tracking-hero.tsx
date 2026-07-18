'use client';

import { Archive, FileDown, RotateCcw } from 'lucide-react';
import Link from 'next/link';

import { CardEyebrow } from '@/components/ui/card/card';
import { paths } from '@/config/paths';
import { formatFrDate } from '@/utils/format-date';

import { DocumentRequestDetail, DocumentStatus } from '../types';

import { DOCUMENT_STATUS_CONFIG } from './document-status-badge';

/**
 * Chemin nominal du workflow et libellé de chaque palier — sert de jauge
 * « suivi de colis » (4 étapes). Les branches (`info_requested`, `rejected`)
 * n'ajoutent pas d'étape : elles se rattachent au palier de vérification ou
 * terminent le parcours.
 */
const NOMINAL_STAGES: { status: DocumentStatus; label: string }[] = [
  { status: 'submitted', label: 'Réception de votre demande' },
  {
    status: 'under_verification',
    label: 'Vérification au registre paroissial',
  },
  { status: 'validated', label: 'Validation et signature du curé' },
  { status: 'document_deposited', label: 'Dépôt dans votre coffre-fort' },
];

/** Chemin nominal seul — consommé par le suivi (`document-detail`). */
export const NOMINAL_PATH: DocumentStatus[] = NOMINAL_STAGES.map(
  (stage) => stage.status,
);

/** Statuts terminaux : plus aucune étape à venir dans le suivi. */
export const TERMINAL_STATUSES: DocumentStatus[] = [
  'document_deposited',
  'rejected',
];

/**
 * Récit de l'état courant. Le *libellé* du statut reste porté par
 * `DOCUMENT_STATUS_CONFIG` (source unique) ; on n'ajoute ici que la phrase
 * qui répond à « où en est ma demande ? ».
 */
const HERO_COPY: Record<DocumentStatus, { title: string; subtitle: string }> = {
  submitted: {
    title: 'Votre demande est enregistrée',
    subtitle: 'Elle part à la vérification de votre paroisse.',
  },
  under_verification: {
    title: 'Votre paroisse vérifie au registre',
    subtitle: 'Le secrétariat paroissial consulte les registres paroissiaux.',
  },
  info_requested: {
    title: 'Votre paroisse attend une précision',
    subtitle: 'La vérification reprendra dès votre réponse.',
  },
  validated: {
    title: 'Validée et signée par le curé',
    subtitle: 'Le dépôt dans votre coffre-fort est imminent.',
  },
  document_deposited: {
    title: 'Votre document est prêt',
    subtitle: 'Il est conservé dans votre coffre-fort numérique.',
  },
  rejected: {
    title: 'Votre demande n’a pas abouti',
    subtitle: 'Vous pouvez la refaire avec d’autres informations.',
  },
};

/**
 * Palier atteint sur la jauge nominale. `info_requested` est une attente au
 * sein de la vérification : la jauge reste au palier 2.
 */
function getStageIndex(status: DocumentStatus): number {
  if (status === 'info_requested')
    return NOMINAL_PATH.indexOf('under_verification');
  const idx = NOMINAL_PATH.indexOf(status);
  return idx === -1 ? 0 : idx;
}

/** Date de la dernière transition connue (log le plus récent), sinon création. */
function getLastTransitionDate(data: DocumentRequestDetail): string {
  const logs = data.status_logs ?? [];
  return logs.length > 0
    ? logs[logs.length - 1].created_at
    : (data.updated_at ?? data.created_at);
}

/**
 * Pièce à télécharger en un clic : le document final déposé par la paroisse
 * en priorité, à défaut la dernière pièce jointe disponible.
 */
function getFinalAttachmentUrl(
  data: DocumentRequestDetail,
): string | undefined {
  const downloadable = (data.attachments ?? []).filter((att) => att.file_url);
  if (downloadable.length === 0) return undefined;
  const final = downloadable.find((att) =>
    att.attachment_type.includes('final'),
  );
  return (final ?? downloadable[downloadable.length - 1]).file_url ?? undefined;
}

const ACTION_LINK_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface TrackingHeroProps {
  document: DocumentRequestDetail;
}

/**
 * Héros d'état courant du suivi « colis » : ce que le fidèle doit comprendre
 * en une seconde en ouvrant la page. Trois mises en scène — parcours en cours
 * (jauge + icône pulsante), aboutissement, refus.
 */
export function TrackingHero({ document: data }: TrackingHeroProps) {
  const config = DOCUMENT_STATUS_CONFIG[data.status];
  const copy = HERO_COPY[data.status];

  if (data.status === 'document_deposited') {
    const downloadUrl = getFinalAttachmentUrl(data);
    return (
      <section
        aria-label="État de la demande"
        className="rounded-2xl border border-success/35 bg-success/10 p-4 shadow-soft-sm sm:p-5"
      >
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success [&_svg]:size-5">
            <span aria-hidden="true">{config.icon}</span>
          </span>
          <div className="min-w-0 flex-1">
            <CardEyebrow className="text-success">{config.label}</CardEyebrow>
            <h2 className="mt-1 font-serif text-lg font-bold leading-tight text-success">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-foreground/75">
              Signé et déposé le{' '}
              {formatFrDate(getLastTransitionDate(data), 'long')}
              {data.parish_name ? ` par ${data.parish_name}` : ''}. Conservé à
              vie dans votre coffre-fort numérique.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ACTION_LINK_CLASS} bg-success text-background hover:bg-success/90`}
                >
                  <FileDown className="size-3.5" aria-hidden="true" />
                  Télécharger le document
                </a>
              )}
              <Link
                href={paths.app.documents.getHref()}
                className={`${ACTION_LINK_CLASS} border border-success/40 bg-card text-success hover:bg-success/10`}
              >
                <Archive className="size-3.5" aria-hidden="true" />
                Ouvrir le coffre-fort
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (data.status === 'rejected') {
    return (
      <section
        aria-label="État de la demande"
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 shadow-soft-sm sm:p-5"
      >
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive [&_svg]:size-5">
            <span aria-hidden="true">{config.icon}</span>
          </span>
          <div className="min-w-0 flex-1">
            <CardEyebrow className="text-destructive">
              {config.label}
            </CardEyebrow>
            <h2 className="mt-1 font-serif text-lg font-bold leading-tight text-foreground">
              {copy.title}
            </h2>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-destructive">
              Motif du refus
            </p>
            <p className="mt-1 text-sm text-destructive/85">
              {data.rejection_reason ??
                'Aucun motif n’a été précisé par la paroisse. Rapprochez-vous d’elle pour en savoir plus.'}
            </p>
            <Link
              href={paths.app.newDocument.getHref()}
              className={`${ACTION_LINK_CLASS} mt-3 border border-primary/30 bg-card text-primary hover:bg-primary/10`}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Refaire une demande
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const stageIndex = getStageIndex(data.status);

  return (
    <section
      aria-label="État de la demande"
      className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-card p-4 shadow-soft-sm sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-gold-ink [&_svg]:size-5">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-accent/30 motion-reduce:hidden"
          />
          <span className="relative" aria-hidden="true">
            {config.icon}
          </span>
        </span>
        <div className="min-w-0">
          <CardEyebrow className="text-gold-ink">{config.label}</CardEyebrow>
          <h2 className="mt-0.5 font-serif text-base font-bold leading-tight text-foreground sm:text-lg">
            {copy.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
        {NOMINAL_STAGES.map((stage, idx) => (
          <span
            key={stage.status}
            className={`h-1.5 flex-1 rounded-full ${
              idx < stageIndex
                ? 'bg-primary'
                : idx === stageIndex
                  ? 'bg-accent'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Étape {stageIndex + 1} sur {NOMINAL_STAGES.length} —{' '}
        {NOMINAL_STAGES[stageIndex].label}
      </p>
    </section>
  );
}
