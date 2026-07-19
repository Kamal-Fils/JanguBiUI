'use client';

import { Check, type LucideIcon } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { cn } from '@/utils/cn';

import type {
  DocumentTypeOption,
  ReasonOption,
} from '../../api/get-document-options';

import { DEFAULT_TYPE_META, DOCUMENT_TYPE_META } from './document-type-meta';
import { errorClass, inputClass, labelClass } from './form-field-classes';
import type { FormValues } from './schema';

// ── DocumentTypeCard ─────────────────────────────────────────────────────────

interface DocumentTypeCardProps {
  value: string;
  /** Libellé servi par le référentiel backend (source unique). */
  label: string;
  description: string;
  Icon: LucideIcon;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

function DocumentTypeCard({
  value,
  label,
  description,
  Icon,
  isSelected,
  onSelect,
}: DocumentTypeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={isSelected}
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border bg-card hover:bg-muted',
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-gold-ink"
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-foreground">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      {isSelected && (
        <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
      )}
    </button>
  );
}

// ── SelectCard (motifs) ──────────────────────────────────────────────────────

function SelectCard({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === opt.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          {opt.label}
          {value === opt.value && (
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-primary"
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Étape 1 — Document (type + motif) ────────────────────────────────────────

interface DocumentStepProps {
  documentTypeOptions: DocumentTypeOption[];
  /** Motifs déjà filtrés selon le type retenu (règle serveur). */
  reasonOptions: ReasonOption[];
  isLoadingOptions: boolean;
  hasOptionsError: boolean;
  selectedType: string;
  selectedReason: string;
  /** « Autre document » : la précision libre devient obligatoire. */
  requiresTypePrecision: boolean;
  onSelectType: (value: string) => void;
  onSelectReason: (value: string) => void;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}

export function DocumentStep({
  documentTypeOptions,
  reasonOptions,
  isLoadingOptions,
  hasOptionsError,
  selectedType,
  selectedReason,
  requiresTypePrecision,
  onSelectType,
  onSelectReason,
  register,
  errors,
}: DocumentStepProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">
          Type de document <span className="text-destructive">*</span>
        </p>
        {isLoadingOptions && (
          <p className="text-sm text-muted-foreground">
            Chargement des types de document…
          </p>
        )}
        {hasOptionsError && (
          <p className={errorClass} role="alert">
            Impossible de charger les types de document. Vérifiez votre
            connexion et rechargez la page.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {documentTypeOptions.map((type) => {
            const meta = DOCUMENT_TYPE_META[type.value] ?? DEFAULT_TYPE_META;
            return (
              <DocumentTypeCard
                key={type.value}
                value={type.value}
                label={type.label}
                description={meta.description}
                Icon={meta.Icon}
                isSelected={selectedType === type.value}
                onSelect={onSelectType}
              />
            );
          })}
        </div>
        {errors.document_type && (
          <p className={errorClass} role="alert">
            {errors.document_type.message}
          </p>
        )}
      </div>
      {requiresTypePrecision && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="document_type_free" className={labelClass}>
            Précisez le document demandé{' '}
            <span className="text-destructive">*</span>
          </label>
          <input
            id="document_type_free"
            className={inputClass}
            placeholder="Ex. : certificat de profession religieuse"
            {...register('document_type_free')}
          />
          {errors.document_type_free && (
            <p className={errorClass} role="alert">
              {errors.document_type_free.message}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">
          Motif de la demande <span className="text-destructive">*</span>
        </p>
        {selectedType === '' ? (
          <p className="text-sm text-muted-foreground">
            Choisissez d’abord un type de document : les motifs proposés en
            dépendent.
          </p>
        ) : (
          <SelectCard
            options={reasonOptions}
            value={selectedReason}
            onChange={onSelectReason}
          />
        )}
        {errors.reason && (
          <p className={errorClass} role="alert">
            {errors.reason.message}
          </p>
        )}
      </div>
      {selectedReason === 'other' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason_free" className={labelClass}>
            Précisez le motif <span className="text-destructive">*</span>
          </label>
          <input
            id="reason_free"
            className={inputClass}
            placeholder="Ex. : dossier de naturalisation"
            {...register('reason_free')}
          />
          {errors.reason_free && (
            <p className={errorClass} role="alert">
              {errors.reason_free.message}
            </p>
          )}
        </div>
      )}
    </>
  );
}
