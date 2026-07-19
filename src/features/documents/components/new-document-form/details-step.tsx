'use client';

import * as React from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { AttachmentField, type AttachmentFieldProps } from './attachment-field';
import {
  errorClass,
  fieldPairClass,
  inputClass,
  labelClass,
} from './form-field-classes';
import type { FormValues } from './schema';

// ── FormSection (sous-sections de l'étape Détails) ───────────────────────────

interface FormSectionProps {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}

function FormSection({ legend, hint, children }: FormSectionProps) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-border bg-background-surface/60 px-4 pb-4 pt-2">
      <legend className="px-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
        {legend}
      </legend>
      {hint && <p className="-mt-2 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </fieldset>
  );
}

// ── Étape 3 — Détails (identité + sacrement + contact + pièce jointe) ────────

interface DetailsStepProps {
  /** Pilote les champs qui n'existent que pour certains types de document. */
  documentType: string;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  /** Props transmises telles quelles au champ de pièce jointe. */
  attachment: AttachmentFieldProps;
}

export function DetailsStep({
  documentType,
  register,
  errors,
  attachment,
}: DetailsStepProps) {
  return (
    <>
      <FormSection legend="Identité du demandeur">
        <div className={fieldPairClass}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="req_first" className={labelClass}>
              Prénom(s) <span className="text-destructive">*</span>
            </label>
            <input
              id="req_first"
              className={inputClass}
              {...register('requester_first_names')}
            />
            {errors.requester_first_names && (
              <p className={errorClass} role="alert">
                {errors.requester_first_names.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="req_last" className={labelClass}>
              Nom <span className="text-destructive">*</span>
            </label>
            <input
              id="req_last"
              className={inputClass}
              {...register('requester_last_name')}
            />
            {errors.requester_last_name && (
              <p className={errorClass} role="alert">
                {errors.requester_last_name.message}
              </p>
            )}
          </div>
        </div>
        <div className={fieldPairClass}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dob" className={labelClass}>
              Date de naissance <span className="text-destructive">*</span>
            </label>
            <input
              id="dob"
              type="date"
              className={inputClass}
              {...register('date_of_birth')}
            />
            {errors.date_of_birth && (
              <p className={errorClass} role="alert">
                {errors.date_of_birth.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pob" className={labelClass}>
              Lieu de naissance <span className="text-destructive">*</span>
            </label>
            <input
              id="pob"
              className={inputClass}
              {...register('place_of_birth')}
            />
            {errors.place_of_birth && (
              <p className={errorClass} role="alert">
                {errors.place_of_birth.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        legend="Le sacrement à retrouver"
        hint="Informations utiles à la recherche dans les registres paroissiaux."
      >
        <div className={fieldPairClass}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="father_last" className={labelClass}>
              Nom du père <span className="text-destructive">*</span>
            </label>
            <input
              id="father_last"
              className={inputClass}
              {...register('father_last_name')}
            />
            {errors.father_last_name && (
              <p className={errorClass} role="alert">
                {errors.father_last_name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mother_last" className={labelClass}>
              Nom de la mère <span className="text-destructive">*</span>
            </label>
            <input
              id="mother_last"
              className={inputClass}
              {...register('mother_last_name')}
            />
            {errors.mother_last_name && (
              <p className={errorClass} role="alert">
                {errors.mother_last_name.message}
              </p>
            )}
          </div>
        </div>
        <div className={fieldPairClass}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sac_date" className={labelClass}>
              Date approx. <span className="text-destructive">*</span>
            </label>
            <input
              id="sac_date"
              placeholder="Ex : 1995 ou 15/06/1995"
              className={inputClass}
              {...register('sacrament_approximate_date')}
            />
            {errors.sacrament_approximate_date && (
              <p className={errorClass} role="alert">
                {errors.sacrament_approximate_date.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sac_loc" className={labelClass}>
              Lieu <span className="text-destructive">*</span>
            </label>
            <input
              id="sac_loc"
              placeholder="Ex : Dakar"
              className={inputClass}
              {...register('sacrament_location')}
            />
            {errors.sacrament_location && (
              <p className={errorClass} role="alert">
                {errors.sacrament_location.message}
              </p>
            )}
          </div>
        </div>

        {/* Champs conditionnels — mariage religieux */}
        {documentType === 'religious_marriage' && (
          <div className={fieldPairClass}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="groom" className={labelClass}>
                Nom complet de l&apos;époux{' '}
                <span className="text-destructive">*</span>
              </label>
              <input
                id="groom"
                placeholder="Prénom(s) et nom de l'époux"
                className={inputClass}
                {...register('spouse_full_name_groom')}
              />
              {errors.spouse_full_name_groom && (
                <p className={errorClass} role="alert">
                  {errors.spouse_full_name_groom.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bride" className={labelClass}>
                Nom complet de l&apos;épouse{' '}
                <span className="text-destructive">*</span>
              </label>
              <input
                id="bride"
                placeholder="Prénom(s) et nom de l'épouse"
                className={inputClass}
                {...register('spouse_full_name_bride')}
              />
              {errors.spouse_full_name_bride && (
                <p className={errorClass} role="alert">
                  {errors.spouse_full_name_bride.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Champs conditionnels — parrain / marraine */}
        {documentType === 'godparent' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="celebration_type" className={labelClass}>
              Type de célébration <span className="text-destructive">*</span>
            </label>
            <input
              id="celebration_type"
              placeholder="Ex : Baptême, Mariage, Confirmation…"
              className={inputClass}
              {...register('celebration_type')}
            />
            {errors.celebration_type && (
              <p className={errorClass} role="alert">
                {errors.celebration_type.message}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="add_info" className={labelClass}>
            Informations complémentaires{' '}
            <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <textarea
            id="add_info"
            rows={3}
            placeholder="Précisions utiles pour la recherche…"
            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            {...register('additional_info')}
          />
        </div>
      </FormSection>

      <FormSection legend="Contact">
        <div className={fieldPairClass}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact_phone" className={labelClass}>
              Téléphone <span className="text-destructive">*</span>
            </label>
            <input
              id="contact_phone"
              type="tel"
              placeholder="+221 77 000 00 00"
              className={inputClass}
              {...register('contact_phone')}
            />
            {errors.contact_phone && (
              <p className={errorClass} role="alert">
                {errors.contact_phone.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact_email" className={labelClass}>
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="contact_email"
              type="email"
              className={inputClass}
              {...register('contact_email')}
            />
            {errors.contact_email && (
              <p className={errorClass} role="alert">
                {errors.contact_email.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection legend="Pièce jointe (optionnel)">
        <AttachmentField {...attachment} />
      </FormSection>
    </>
  );
}
