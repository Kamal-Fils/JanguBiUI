'use client';

import { CheckCircle2 } from 'lucide-react';
import * as React from 'react';
import type { FieldErrors } from 'react-hook-form';

import type { PickedParish } from '@/components/org/parish-picker';
import { Card } from '@/components/ui/card/card';
import { cn } from '@/utils/cn';

import type {
  DocumentTypeOption,
  ReasonOption,
} from '../../api/get-document-options';
import { formatCalendarDate } from '../../utils/format-calendar-date';
import { formatDocumentType } from '../../utils/format-document-type';

import { errorClass } from './form-field-classes';
import type { FormValues } from './schema';

// ── Récapitulatif sectionné ──────────────────────────────────────────────────

interface RecapSectionProps {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

function RecapSection({ title, onEdit, children }: RecapSectionProps) {
  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/50 px-4 py-2.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md px-1 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true">Modifier</span>
          <span className="sr-only">Modifier la section {title}</span>
        </button>
      </div>
      <dl className="flex flex-col gap-2 px-4 py-3 text-sm">{children}</dl>
    </Card>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

// ── Étape 4 — Validation (récap sectionné + consentement) ────────────────────

interface ReviewStepProps {
  /** Instantané des valeurs saisies (`getValues()`), affiché tel quel. */
  values: FormValues;
  documentTypeOptions: DocumentTypeOption[];
  /**
   * TOUS les motifs du référentiel, pas ceux filtrés par le type : le récap doit
   * savoir nommer le motif retenu même si le filtre a changé entre-temps.
   */
  reasons: ReasonOption[];
  pickedParish: PickedParish | null;
  fileName: string | null;
  consentGiven: boolean;
  onToggleConsent: () => void;
  /** Renvoie à l'étape d'index donné via le lien « Modifier ». */
  onEditStep: (stepIndex: number) => void;
  errors: FieldErrors<FormValues>;
}

export function ReviewStep({
  values,
  documentTypeOptions,
  reasons,
  pickedParish,
  fileName,
  consentGiven,
  onToggleConsent,
  onEditStep,
  errors,
}: ReviewStepProps) {
  return (
    <>
      <RecapSection title="Document" onEdit={() => onEditStep(0)}>
        <RecapRow
          label="Type"
          value={
            documentTypeOptions.find((t) => t.value === values.document_type)
              ?.label ?? formatDocumentType(values.document_type)
          }
        />
        {values.document_type === 'other' && values.document_type_free && (
          <RecapRow
            label="Document précisé"
            value={values.document_type_free}
          />
        )}
        <RecapRow
          label="Motif"
          value={reasons.find((r) => r.value === values.reason)?.label ?? '—'}
        />
        {values.reason === 'other' && values.reason_free && (
          <RecapRow label="Précision" value={values.reason_free} />
        )}
      </RecapSection>

      <RecapSection title="Paroisse du registre" onEdit={() => onEditStep(1)}>
        <RecapRow label="Paroisse" value={pickedParish?.name ?? '—'} />
        <RecapRow
          label="Diocèse"
          value={
            pickedParish?.dioceseName
              ? `${pickedParish.dioceseName} (déduit)`
              : '—'
          }
        />
      </RecapSection>

      <RecapSection title="Détails" onEdit={() => onEditStep(2)}>
        <RecapRow
          label="Demandeur"
          value={`${values.requester_first_names} ${values.requester_last_name}`}
        />
        <RecapRow
          label="Né(e) le"
          value={`${formatCalendarDate(values.date_of_birth)} · ${values.place_of_birth}`}
        />
        <RecapRow
          label="Parents"
          value={`${values.father_last_name} · ${values.mother_last_name}`}
        />
        <RecapRow
          label="Sacrement"
          value={`≈ ${values.sacrament_approximate_date} · ${values.sacrament_location}`}
        />
        {values.document_type === 'religious_marriage' && (
          <RecapRow
            label="Époux"
            value={`${values.spouse_full_name_groom} · ${values.spouse_full_name_bride}`}
          />
        )}
        {values.document_type === 'godparent' && (
          <RecapRow
            label="Célébration"
            value={values.celebration_type ?? '—'}
          />
        )}
        <RecapRow label="Contact" value={values.contact_phone} />
        <RecapRow label="Email" value={values.contact_email} />
        {values.additional_info && (
          <RecapRow
            label="Informations complémentaires"
            value={values.additional_info}
          />
        )}
        <RecapRow label="Pièce jointe" value={fileName ?? 'Aucune'} />
      </RecapSection>

      <button
        type="button"
        onClick={onToggleConsent}
        aria-pressed={consentGiven}
        className={cn(
          'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          consentGiven
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card',
        )}
      >
        <CheckCircle2
          aria-hidden="true"
          className={cn(
            'mt-0.5 size-5 shrink-0',
            consentGiven ? 'text-primary' : 'text-muted-foreground/40',
          )}
        />
        <span className="text-sm text-foreground">
          Je certifie que les informations fournies sont exactes et
          j&apos;accepte que mes données soient traitées dans le cadre de cette
          demande.
        </span>
      </button>
      {errors.consent_given && (
        <p className={errorClass} role="alert">
          {errors.consent_given.message}
        </p>
      )}
    </>
  );
}
