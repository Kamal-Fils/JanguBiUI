'use client';

import type { FieldErrors } from 'react-hook-form';

import {
  ParishPicker,
  type PickedParish,
} from '@/components/org/parish-picker';

import { errorClass, labelClass } from './form-field-classes';
import type { FormValues } from './schema';

// ── Étape 2 — Paroisse du registre ───────────────────────────────────────────

interface ParishStepProps {
  pickedParish: PickedParish | null;
  onPickParish: (parish: PickedParish | null) => void;
  errors: FieldErrors<FormValues>;
}

/**
 * La paroisse est choisie via le picker partagé (FK `parish_id`), jamais saisie
 * en texte libre : le diocèse en est déduit côté serveur.
 */
export function ParishStep({
  pickedParish,
  onPickParish,
  errors,
}: ParishStepProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>
        Paroisse du sacrement <span className="text-destructive">*</span>
      </span>
      <p className="text-xs text-muted-foreground">
        Choisissez parmi vos paroisses ou recherchez la paroisse du registre.
      </p>
      <ParishPicker value={pickedParish} onChange={onPickParish} />
      {errors.parish_id && (
        <p className={errorClass} role="alert">
          {errors.parish_id.message}
        </p>
      )}
    </div>
  );
}
