'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Droplets,
  Flame,
  FileText,
  Gem,
  HandHeart,
  Loader2,
  type LucideIcon,
  Paperclip,
  Wheat,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ContentContainer } from '@/components/layouts/content-container';
import {
  ParishPicker,
  type PickedParish,
} from '@/components/org/parish-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

import { CreateDocumentInput, useCreateDocument } from '../api/create-document';
import { useUploadDocumentFile } from '../api/upload-document-file';
import { formatDocumentType } from '../utils/format-document-type';

import { WizardStepper } from './wizard-stepper';

// ── File upload constants ────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png';

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Les 5 types réels du contrat backend. Le **libellé** vient de la source
 * unique `formatDocumentType` (utils de la feature) : on n'ajoute ici que les
 * repères de choix demandés par la maquette 02 (icône + usage), jamais un
 * libellé concurrent.
 */
const DOCUMENT_TYPES: {
  value: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    value: 'baptism',
    description:
      'Le plus demandé — requis pour le mariage, le parrainage et la catéchèse.',
    Icon: Droplets,
  },
  {
    value: 'first_communion',
    description: "Atteste la réception de l'Eucharistie.",
    Icon: Wheat,
  },
  {
    value: 'confirmation',
    description: 'Requise pour être parrain ou marraine.',
    Icon: Flame,
  },
  {
    value: 'religious_marriage',
    description: 'Noms des deux époux demandés à l’étape Détails.',
    Icon: Gem,
  },
  {
    value: 'godparent',
    description: 'Précisez la célébration concernée.',
    Icon: HandHeart,
  },
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
/** Paire de champs : empilée sur mobile, 2 colonnes dès `sm` (fin du `flex gap-3` écrasé). */
const fieldPairClass = 'grid grid-cols-1 gap-3 sm:grid-cols-2';

// ── Schema (inchangé — même contrat, mêmes règles) ───────────────────────────

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

// ── Étapes : 6 micro-étapes → 4 étapes nommées (D3) ──────────────────────────
//
// Correspondance avec l'ancien découpage :
//   type                        → document
//   (paroisse extraite de search) → parish
//   identity + search + contact + attachments → details (sous-sections)
//   consent                     → review
// Aucun champ ajouté ni retiré : le payload `CreateDocumentInput` est inchangé.

type Step = 'document' | 'parish' | 'details' | 'review';

const STEPS: Step[] = ['document', 'parish', 'details', 'review'];

const STEP_LABELS: Record<Step, string> = {
  document: 'Document',
  parish: 'Paroisse',
  details: 'Détails',
  review: 'Validation',
};

const STEP_TITLES: Record<Step, string> = {
  document: 'Quel document ?',
  parish: 'Quelle paroisse ?',
  details: 'Vos informations',
  review: 'Récapitulatif',
};

const STEP_HINTS: Record<Step, string> = {
  document: 'Choisissez le document souhaité, puis le motif de la demande.',
  parish:
    'La paroisse qui détient le registre de votre sacrement. Le diocèse est déduit automatiquement.',
  details:
    'Ces éléments permettent de retrouver votre acte dans les registres paroissiaux.',
  review: 'Vérifiez chaque section, puis confirmez pour envoyer votre demande.',
};

const STEP_FIELDS: Record<Step, (keyof FormValues)[]> = {
  document: ['document_type', 'reason'],
  parish: ['parish_id'],
  details: [
    'requester_first_names',
    'requester_last_name',
    'date_of_birth',
    'place_of_birth',
    'father_last_name',
    'mother_last_name',
    'sacrament_approximate_date',
    'sacrament_location',
    'spouse_full_name_groom',
    'spouse_full_name_bride',
    'celebration_type',
    'contact_phone',
    'contact_email',
  ],
  review: ['consent_given'],
};

const STEP_LABEL_LIST = STEPS.map((s) => STEP_LABELS[s]);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * `<input type="date">` renvoie une date **calendaire** (`YYYY-MM-DD`), pas un
 * instant : la passer à `new Date()` la parse en UTC et peut décaler d'un jour
 * selon le fuseau. On reformate donc en pur texte (pas de `formatFrDate`, qui
 * traite des instants ISO).
 */
function formatCalendarDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

// ── DocumentTypeCard ─────────────────────────────────────────────────────────

interface DocumentTypeCardProps {
  value: string;
  description: string;
  Icon: LucideIcon;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

function DocumentTypeCard({
  value,
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
          {formatDocumentType(value)}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {description}
        </span>
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

// ── AttachmentField ──────────────────────────────────────────────────────────

interface AttachmentFieldProps {
  fileName: string | null;
  fileError: string | null;
  isUploading: boolean;
  isUploaded: boolean;
  onSelectFile: (file: File) => void;
  onClear: () => void;
}

function AttachmentField({
  fileName,
  fileError,
  isUploading,
  isUploaded,
  onSelectFile,
  onClear,
}: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <p className="text-xs text-muted-foreground">
        Ajoutez un justificatif (acte de naissance, livret de famille, etc.) —
        formats acceptés&nbsp;: PDF, JPG, PNG. Taille max&nbsp;: 10&nbsp;Mo.
      </p>

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
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
        >
          <Paperclip
            aria-hidden="true"
            className="size-6 text-muted-foreground"
          />
          <span className="text-sm font-medium text-foreground">
            Choisir un fichier
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, JPG ou PNG · 10&nbsp;Mo max
          </span>
        </button>
      )}

      {isUploading && (
        <Card variant="elevated" className="flex items-center gap-3 px-4 py-3">
          <Loader2
            aria-hidden="true"
            className="size-5 animate-spin text-primary"
          />
          <span className="text-sm text-muted-foreground">
            Téléversement en cours…
          </span>
        </Card>
      )}

      {fileName && !isUploading && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
          <FileText
            aria-hidden="true"
            className="size-5 shrink-0 text-primary"
          />
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
            <X aria-hidden="true" className="size-4" />
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

// ── Main component ───────────────────────────────────────────────────────────

export function NewDocumentForm() {
  const router = useRouter();
  const { data: user } = useUser();
  const { addNotification } = useNotifications();
  const [stepIndex, setStepIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pickedParish, setPickedParish] = useState<PickedParish | null>(null);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  // Focus management : à chaque changement d'étape, le focus va sur le titre de
  // la nouvelle étape (sinon il resterait sur un bouton démonté).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stepIndex]);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
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

  const { mutate, isPending } = useCreateDocument();

  const { mutate: uploadFile, isPending: isUploading } =
    useUploadDocumentFile();

  const watchedAttachmentId = watch('attachment_file_id');

  /** Le tunnel contient-il du travail à perdre ? (garde de sortie) */
  const hasEnteredData = isDirty || pickedParish !== null || fileName !== null;

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

  /** Retour : étape précédente, ou sortie du tunnel (avec garde) depuis l'étape 1. */
  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      return;
    }
    if (hasEnteredData) {
      setIsExitDialogOpen(true);
      return;
    }
    router.back();
  }

  function handlePickParish(parish: PickedParish | null) {
    setPickedParish(parish);
    setValue(
      'parish_id',
      parish ? parish.id : (undefined as unknown as number),
      { shouldValidate: true, shouldDirty: true },
    );
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
      // Paroisse du registre : FK seule (B5c). Le back dérive nom + diocèse.
      parish_id: values.parish_id,
      sacrament_approximate_date: values.sacrament_approximate_date,
      sacrament_location: values.sacrament_location,
      additional_info: values.additional_info || undefined,
      document_details: buildDocumentDetails(values),
      attachment_file_id: values.attachment_file_id ?? null,
      consent_given: true,
    };
    mutate(payload, {
      // Feedback succès + redirection vers le SUIVI de la demande créée
      // (page détail), pas vers la liste : le fidèle voit tout de suite la
      // timeline de sa démarche.
      onSuccess: (created) => {
        addNotification({
          type: 'success',
          title: 'Demande envoyée',
          message:
            'Votre demande a bien été transmise à la paroisse. Suivez son avancement pas à pas.',
        });
        router.push(paths.app.document.getHref(created.id));
      },
    });
  }

  const watchedDocumentType = watch('document_type');
  const watchedReason = watch('reason');
  const watchedConsentGiven = watch('consent_given');

  const recap = getValues();

  return (
    <div className="flex flex-col">
      {/* En-tête sticky : retour conscient des étapes + stepper nommé */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <ContentContainer width="narrow" className="py-0">
          <div className="flex items-center gap-3 py-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full hover:bg-muted"
              aria-label={
                stepIndex === 0 ? 'Quitter la demande' : 'Étape précédente'
              }
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
            </Button>
            <span className="text-sm font-semibold text-foreground">
              Demander un document
            </span>
          </div>
          <WizardStepper
            steps={STEP_LABEL_LIST}
            current={stepIndex}
            onStepSelect={setStepIndex}
            className="pb-3"
          />
        </ContentContainer>
      </div>

      <ContentContainer width="narrow">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p
              aria-hidden="true"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink"
            >
              Étape {stepIndex + 1} sur {STEPS.length}
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-serif text-xl font-bold tracking-tight text-foreground outline-none"
            >
              {STEP_TITLES[step]}
            </h2>
            <p className="text-sm text-muted-foreground">{STEP_HINTS[step]}</p>
          </div>

          {/* Étape 1 — Document (type + motif) */}
          {step === 'document' && (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Type de document <span className="text-destructive">*</span>
                </p>
                <div className="flex flex-col gap-2">
                  {DOCUMENT_TYPES.map((type) => (
                    <DocumentTypeCard
                      key={type.value}
                      value={type.value}
                      description={type.description}
                      Icon={type.Icon}
                      isSelected={watchedDocumentType === type.value}
                      onSelect={(v) =>
                        setValue('document_type', v, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                  ))}
                </div>
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
                  onChange={(v) =>
                    setValue('reason', v, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
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

          {/* Étape 2 — Paroisse du registre */}
          {step === 'parish' && (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>
                Paroisse du sacrement{' '}
                <span className="text-destructive">*</span>
              </span>
              <p className="text-xs text-muted-foreground">
                Choisissez parmi vos paroisses ou recherchez la paroisse du
                registre.
              </p>
              <ParishPicker value={pickedParish} onChange={handlePickParish} />
              {errors.parish_id && (
                <p className={errorClass} role="alert">
                  {errors.parish_id.message}
                </p>
              )}
            </div>
          )}

          {/* Étape 3 — Détails (identité + sacrement + contact + pièce jointe) */}
          {step === 'details' && (
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
                      Date de naissance{' '}
                      <span className="text-destructive">*</span>
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
                      Lieu de naissance{' '}
                      <span className="text-destructive">*</span>
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
                {watchedDocumentType === 'religious_marriage' && (
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
                <AttachmentField
                  fileName={fileName}
                  fileError={fileError}
                  isUploading={isUploading}
                  isUploaded={watchedAttachmentId != null}
                  onSelectFile={handleSelectFile}
                  onClear={handleClearFile}
                />
              </FormSection>
            </>
          )}

          {/* Étape 4 — Validation (récap sectionné + consentement) */}
          {step === 'review' && (
            <>
              <RecapSection title="Document" onEdit={() => setStepIndex(0)}>
                <RecapRow
                  label="Type"
                  value={formatDocumentType(recap.document_type)}
                />
                <RecapRow
                  label="Motif"
                  value={
                    REQUEST_REASONS.find((r) => r.value === recap.reason)
                      ?.label ?? '—'
                  }
                />
                {recap.reason === 'other' && recap.reason_free && (
                  <RecapRow label="Précision" value={recap.reason_free} />
                )}
              </RecapSection>

              <RecapSection
                title="Paroisse du registre"
                onEdit={() => setStepIndex(1)}
              >
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

              <RecapSection title="Détails" onEdit={() => setStepIndex(2)}>
                <RecapRow
                  label="Demandeur"
                  value={`${recap.requester_first_names} ${recap.requester_last_name}`}
                />
                <RecapRow
                  label="Né(e) le"
                  value={`${formatCalendarDate(recap.date_of_birth)} · ${recap.place_of_birth}`}
                />
                <RecapRow
                  label="Parents"
                  value={`${recap.father_last_name} · ${recap.mother_last_name}`}
                />
                <RecapRow
                  label="Sacrement"
                  value={`≈ ${recap.sacrament_approximate_date} · ${recap.sacrament_location}`}
                />
                {recap.document_type === 'religious_marriage' && (
                  <RecapRow
                    label="Époux"
                    value={`${recap.spouse_full_name_groom} · ${recap.spouse_full_name_bride}`}
                  />
                )}
                {recap.document_type === 'godparent' && (
                  <RecapRow
                    label="Célébration"
                    value={recap.celebration_type ?? '—'}
                  />
                )}
                <RecapRow label="Contact" value={recap.contact_phone} />
                <RecapRow label="Email" value={recap.contact_email} />
                {recap.additional_info && (
                  <RecapRow
                    label="Informations complémentaires"
                    value={recap.additional_info}
                  />
                )}
                <RecapRow label="Pièce jointe" value={fileName ?? 'Aucune'} />
              </RecapSection>

              <button
                type="button"
                onClick={() =>
                  setValue('consent_given', !watchedConsentGiven, {
                    shouldDirty: true,
                  })
                }
                aria-pressed={watchedConsentGiven}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  watchedConsentGiven
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card',
                )}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 size-5 shrink-0',
                    watchedConsentGiven
                      ? 'text-primary'
                      : 'text-muted-foreground/40',
                  )}
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

          {/* Navigation */}
          {!isLastStep ? (
            <Button
              type="button"
              size="lg"
              fullWidth
              onClick={handleNext}
              isLoading={step === 'details' && isUploading}
              icon={<ArrowRight aria-hidden="true" className="size-4" />}
              iconPosition="right"
            >
              {step === 'details' && isUploading
                ? 'Téléversement…'
                : 'Continuer'}
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              fullWidth
              isLoading={isPending}
              disabled={!watchedConsentGiven}
            >
              {isPending ? 'Envoi en cours…' : 'Envoyer la demande'}
            </Button>
          )}
        </form>
      </ContentContainer>

      {/* Garde de sortie : ne pas perdre une saisie en cours sur un retour. */}
      <AlertDialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter la demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les informations déjà saisies ne seront pas enregistrées. Vous
              devrez recommencer la demande depuis le début.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer ma demande</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.back()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
