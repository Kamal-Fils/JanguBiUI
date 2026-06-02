'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  ParishPicker,
  type PickedParish,
} from '@/features/org/components/parish-picker';
import { useUser } from '@/lib/auth';

import { CreateDocumentInput, useCreateDocument } from '../api/create-document';
import { useUploadDocumentFile } from '../api/upload-document-file';

// ── File upload constants ────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png';

// ── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  { value: 'baptism', label: 'Certificat de baptême' },
  { value: 'first_communion', label: 'Attestation de première communion' },
  { value: 'confirmation', label: 'Attestation de confirmation' },
  { value: 'religious_marriage', label: 'Attestation de mariage religieux' },
  { value: 'godparent', label: 'Attestation parrain / marraine' },
];

const REQUEST_REASONS = [
  { value: 'religious_marriage', label: 'Mariage religieux' },
  { value: 'godparent', label: 'Parrain / marraine' },
  { value: 'catechism', label: 'Inscription catéchèse' },
  { value: 'parish_file', label: 'Dossier paroissial' },
  { value: 'personal', label: 'Usage personnel' },
  { value: 'other', label: 'Autre' },
];

const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelClass = 'text-sm font-medium text-foreground';
const errorClass = 'mt-1 text-xs text-destructive';

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    document_type: z
      .string()
      .min(1, 'Veuillez sélectionner un type de document'),
    reason: z.string().min(1, 'Veuillez sélectionner un motif'),
    reason_free: z.string().optional(),
    requester_first_names: z.string().min(1, 'Prénom(s) requis'),
    requester_last_name: z.string().min(1, 'Nom requis'),
    date_of_birth: z.string().min(1, 'Date de naissance requise'),
    place_of_birth: z.string().min(1, 'Lieu de naissance requis'),
    father_last_name: z.string().min(1, 'Nom du père requis'),
    mother_last_name: z.string().min(1, 'Nom de la mère requis'),
    // Paroisse du registre choisie via le picker (FK). parish_name/diocese sont
    // dérivés de la paroisse sélectionnée et envoyés au back (validation).
    parish_id: z
      .number({
        required_error: 'Paroisse requise',
        invalid_type_error: 'Paroisse requise',
      })
      .int()
      .positive('Paroisse requise'),
    parish_name: z.string().optional(),
    diocese: z.string().optional(),
    sacrament_approximate_date: z.string().min(1, 'Date approximative requise'),
    sacrament_location: z.string().min(1, 'Lieu du sacrement requis'),
    additional_info: z.string().optional(),
    contact_phone: z.string().min(1, 'Téléphone requis'),
    contact_email: z.string().email('Email invalide'),
    attachment_file_id: z.number().nullable().optional(),
    consent_given: z.boolean().refine((v) => v === true, {
      message: 'Vous devez accepter les conditions.',
    }),
    // Champs conditionnels selon le type de document
    spouse_full_name_groom: z.string().optional(),
    spouse_full_name_bride: z.string().optional(),
    celebration_type: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.document_type === 'religious_marriage') {
      if (!data.spouse_full_name_groom?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nom complet de l'époux requis",
          path: ['spouse_full_name_groom'],
        });
      }
      if (!data.spouse_full_name_bride?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nom complet de l'épouse requis",
          path: ['spouse_full_name_bride'],
        });
      }
    }
    if (data.document_type === 'godparent') {
      if (!data.celebration_type?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Type de célébration requis',
          path: ['celebration_type'],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

// ── Step metadata ─────────────────────────────────────────────────────────────

type Step =
  | 'type'
  | 'identity'
  | 'search'
  | 'contact'
  | 'attachments'
  | 'consent';

const STEPS: Step[] = [
  'type',
  'identity',
  'search',
  'contact',
  'attachments',
  'consent',
];

const STEP_LABELS: Record<Step, string> = {
  type: 'Type',
  identity: 'Identité',
  search: 'Sacrement',
  contact: 'Contact',
  attachments: 'Pièces jointes',
  consent: 'Validation',
};

const STEP_FIELDS: Record<Step, (keyof FormValues)[]> = {
  type: ['document_type', 'reason'],
  identity: [
    'requester_first_names',
    'requester_last_name',
    'date_of_birth',
    'place_of_birth',
  ],
  search: [
    'father_last_name',
    'mother_last_name',
    'parish_id',
    'sacrament_approximate_date',
    'sacrament_location',
    'spouse_full_name_groom',
    'spouse_full_name_bride',
    'celebration_type',
  ],
  contact: ['contact_phone', 'contact_email'],
  attachments: [],
  consent: ['consent_given'],
};

// ── SelectCard ───────────────────────────────────────────────────────────────

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
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
            value === opt.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-foreground hover:bg-muted'
          }`}
        >
          {opt.label}
          {value === opt.value && (
            <span className="size-2 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

// ── AttachmentStep ───────────────────────────────────────────────────────────

interface AttachmentStepProps {
  fileName: string | null;
  fileError: string | null;
  isUploading: boolean;
  isUploaded: boolean;
  onSelectFile: (file: File) => void;
  onClear: () => void;
}

function AttachmentStep({
  fileName,
  fileError,
  isUploading,
  isUploaded,
  onSelectFile,
  onClear,
}: AttachmentStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">
          Pièce jointe{' '}
          <span className="text-muted-foreground">(optionnel)</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Ajoutez un justificatif (acte de naissance, livret de famille, etc.) —
          formats acceptés&nbsp;: PDF, JPG, PNG. Taille max&nbsp;: 10&nbsp;Mo.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
          // Allow re-selecting the same file later
          e.target.value = '';
        }}
        aria-label="Sélectionner un fichier"
      />

      {!fileName && !isUploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary/5"
        >
          <Paperclip className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Choisir un fichier
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, JPG ou PNG · 10&nbsp;Mo max
          </span>
        </button>
      )}

      {isUploading && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Téléversement en cours…
          </span>
        </div>
      )}

      {fileName && !isUploading && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
          <FileText className="size-5 shrink-0 text-primary" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {fileName}
            </span>
            {isUploaded && (
              <span className="text-xs text-primary">
                Téléversé avec succès
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Retirer le fichier"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {fileError && (
        <p className={errorClass} role="alert">
          {fileError}
        </p>
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function NewDocumentForm() {
  const router = useRouter();
  const { data: user } = useUser();
  const [stepIndex, setStepIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pickedParish, setPickedParish] = useState<PickedParish | null>(null);

  const step = STEPS[stepIndex];

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      document_type: '',
      reason: '',
      reason_free: '',
      requester_first_names: user?.profile?.first_name ?? '',
      requester_last_name: user?.profile?.last_name ?? '',
      date_of_birth: '',
      place_of_birth: '',
      father_last_name: '',
      mother_last_name: '',
      parish_id: undefined,
      parish_name: '',
      diocese: '',
      sacrament_approximate_date: '',
      sacrament_location: '',
      additional_info: '',
      contact_phone: user?.profile?.phone ?? '',
      contact_email: user?.email ?? '',
      attachment_file_id: null,
      consent_given: false,
      spouse_full_name_groom: '',
      spouse_full_name_bride: '',
      celebration_type: '',
    },
  });

  const { mutate, isPending } = useCreateDocument({
    onSuccess: () => router.push('/app/documents'),
  });

  const { mutate: uploadFile, isPending: isUploading } =
    useUploadDocumentFile();

  const watchedAttachmentId = watch('attachment_file_id');

  function handleSelectFile(file: File) {
    setFileError(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Le fichier dépasse la taille maximale de 10 Mo.');
      return;
    }

    setFileName(file.name);
    setValue('attachment_file_id', null);

    uploadFile(file, {
      onSuccess: (res) => {
        setValue('attachment_file_id', res.id);
      },
      onError: () => {
        setFileError(
          'Échec du téléversement. Vérifiez votre connexion et réessayez.',
        );
        setFileName(null);
      },
    });
  }

  function handleClearFile() {
    setFileName(null);
    setFileError(null);
    setValue('attachment_file_id', null);
  }

  async function handleNext() {
    const fieldsForStep = STEP_FIELDS[step];
    const valid = await trigger(fieldsForStep);
    if (valid) setStepIndex((i) => i + 1);
  }

  function handlePickParish(parish: PickedParish | null) {
    setPickedParish(parish);
    setValue(
      'parish_id',
      parish ? parish.id : (undefined as unknown as number),
      { shouldValidate: true },
    );
    setValue('parish_name', parish?.name ?? '');
    setValue('diocese', parish?.dioceseName ?? '');
  }

  function buildDocumentDetails(
    values: FormValues,
  ): Record<string, string> | undefined {
    if (values.document_type === 'religious_marriage') {
      return {
        spouse_full_name_groom: values.spouse_full_name_groom ?? '',
        spouse_full_name_bride: values.spouse_full_name_bride ?? '',
      };
    }
    if (values.document_type === 'godparent') {
      return {
        celebration_type: values.celebration_type ?? '',
      };
    }
    return undefined;
  }

  function onSubmit(values: FormValues) {
    if (!values.consent_given) return;
    const payload: CreateDocumentInput = {
      document_type: values.document_type,
      reason: values.reason,
      reason_free: values.reason_free || undefined,
      requester_last_name: values.requester_last_name,
      requester_first_names: values.requester_first_names,
      date_of_birth: values.date_of_birth,
      place_of_birth: values.place_of_birth,
      contact_phone: values.contact_phone,
      contact_email: values.contact_email,
      father_last_name: values.father_last_name,
      mother_last_name: values.mother_last_name,
      // Paroisse du registre : FK + libellés dérivés (le back réécrit le
      // diocèse depuis la FK — C4). Fallback non vide pour passer la validation.
      parish_id: values.parish_id,
      parish_name: values.parish_name || pickedParish?.name || '',
      diocese: values.diocese || pickedParish?.dioceseName || '—',
      sacrament_approximate_date: values.sacrament_approximate_date,
      sacrament_location: values.sacrament_location,
      additional_info: values.additional_info || undefined,
      document_details: buildDocumentDetails(values),
      attachment_file_id: values.attachment_file_id ?? null,
      consent_given: true,
    };
    mutate(payload);
  }

  const watchedDocumentType = watch('document_type');
  const watchedReason = watch('reason');
  const watchedConsentGiven = watch('consent_given');

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={
            stepIndex === 0
              ? () => router.back()
              : () => setStepIndex((i) => i - 1)
          }
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          Nouvelle demande
        </span>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 pt-4">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="px-4 pt-2 text-xs text-muted-foreground">
        Étape {stepIndex + 1} sur {STEPS.length} — {STEP_LABELS[step]}
      </p>

      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Step 1 — Type */}
          {step === 'type' && (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Type de document <span className="text-destructive">*</span>
                </p>
                <SelectCard
                  options={DOCUMENT_TYPES}
                  value={watchedDocumentType}
                  onChange={(v) => setValue('document_type', v)}
                />
                {errors.document_type && (
                  <p className={errorClass} role="alert">
                    {errors.document_type.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Motif de la demande{' '}
                  <span className="text-destructive">*</span>
                </p>
                <SelectCard
                  options={REQUEST_REASONS}
                  value={watchedReason}
                  onChange={(v) => setValue('reason', v)}
                />
                {errors.reason && (
                  <p className={errorClass} role="alert">
                    {errors.reason.message}
                  </p>
                )}
              </div>
              {watchedReason === 'other' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reason_free" className={labelClass}>
                    Précisez le motif
                  </label>
                  <input
                    id="reason_free"
                    className={inputClass}
                    {...register('reason_free')}
                  />
                </div>
              )}
            </>
          )}

          {/* Step 2 — Identity */}
          {step === 'identity' && (
            <>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
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
                <div className="flex flex-1 flex-col gap-1.5">
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
            </>
          )}

          {/* Step 3 — Sacrament search */}
          {step === 'search' && (
            <>
              <p className="text-sm text-muted-foreground">
                Informations pour retrouver votre acte dans les registres
                paroissiaux.
              </p>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
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
                <div className="flex flex-1 flex-col gap-1.5">
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
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  Paroisse du sacrement{' '}
                  <span className="text-destructive">*</span>
                </span>
                <p className="text-xs text-muted-foreground">
                  Choisissez parmi vos paroisses ou recherchez la paroisse du
                  registre (le diocèse est déduit automatiquement).
                </p>
                <ParishPicker value={pickedParish} onChange={handlePickParish} />
                {errors.parish_id && (
                  <p className={errorClass} role="alert">
                    {errors.parish_id.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
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
                <div className="flex flex-1 flex-col gap-1.5">
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
              {watchedDocumentType === 'religious_marriage' && (
                <>
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
                </>
              )}

              {/* Champs conditionnels — parrain / marraine */}
              {watchedDocumentType === 'godparent' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="celebration_type" className={labelClass}>
                    Type de célébration{' '}
                    <span className="text-destructive">*</span>
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
            </>
          )}

          {/* Step 4 — Contact */}
          {step === 'contact' && (
            <>
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
            </>
          )}

          {/* Step 5 — Attachments (optional) */}
          {step === 'attachments' && (
            <AttachmentStep
              fileName={fileName}
              fileError={fileError}
              isUploading={isUploading}
              isUploaded={watchedAttachmentId != null}
              onSelectFile={handleSelectFile}
              onClear={handleClearFile}
            />
          )}

          {/* Step 6 — Consent */}
          {step === 'consent' && (
            <>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-2 font-semibold text-foreground">
                  Récapitulatif
                </h3>
                <dl className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Document</dt>
                    <dd className="font-medium text-foreground">
                      {
                        DOCUMENT_TYPES.find(
                          (d) => d.value === watchedDocumentType,
                        )?.label
                      }
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Motif</dt>
                    <dd className="font-medium text-foreground">
                      {
                        REQUEST_REASONS.find((r) => r.value === watchedReason)
                          ?.label
                      }
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Nom</dt>
                    <dd className="font-medium text-foreground">
                      {watch('requester_first_names')}{' '}
                      {watch('requester_last_name')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Paroisse</dt>
                    <dd className="font-medium text-foreground">
                      {watch('parish_name')}
                    </dd>
                  </div>
                </dl>
              </div>
              <button
                type="button"
                onClick={() => setValue('consent_given', !watchedConsentGiven)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  watchedConsentGiven
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <CheckCircle2
                  className={`mt-0.5 size-5 shrink-0 ${
                    watchedConsentGiven
                      ? 'text-primary'
                      : 'text-muted-foreground/40'
                  }`}
                />
                <span className="text-sm text-foreground">
                  Je certifie que les informations fournies sont exactes et
                  j&apos;accepte que mes données soient traitées dans le cadre
                  de cette demande.
                </span>
              </button>
              {errors.consent_given && (
                <p className={errorClass} role="alert">
                  {errors.consent_given.message}
                </p>
              )}
            </>
          )}

          {/* Navigation buttons */}
          {step !== 'consent' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 'attachments' && isUploading}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {step === 'attachments' && isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Téléversement…
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!watchedConsentGiven || isPending}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? 'Envoi en cours…' : 'Envoyer la demande'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
