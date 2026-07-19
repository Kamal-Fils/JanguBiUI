'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ContentContainer } from '@/components/layouts/content-container';
import type { PickedParish } from '@/components/org/parish-picker';
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
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

import { useCreateDocument } from '../api/create-document';
import { useDocumentOptions } from '../api/get-document-options';
import { useUploadDocumentFile } from '../api/upload-document-file';

import { buildCreateDocumentPayload } from './new-document-form/build-create-document-payload';
import { DetailsStep } from './new-document-form/details-step';
import { DocumentStep } from './new-document-form/document-step';
import { ParishStep } from './new-document-form/parish-step';
import { ReviewStep } from './new-document-form/review-step';
import {
  type FormValues,
  precisionIssues,
  schema,
} from './new-document-form/schema';
import {
  STEP_FIELDS,
  STEP_HINTS,
  STEP_LABEL_LIST,
  STEP_TITLES,
  STEPS,
} from './new-document-form/steps';
import { WizardStepper } from './wizard-stepper';

// ── File upload constants ────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Main component ───────────────────────────────────────────────────────────

/**
 * Tunnel de demande de document en 4 étapes (Document · Paroisse · Détails ·
 * Validation).
 *
 * Ce composant orchestre : il détient l'état du tunnel (étape courante, paroisse
 * choisie, pièce jointe), le formulaire react-hook-form et la soumission. Le
 * rendu de chaque étape vit dans `./new-document-form/*-step.tsx`.
 *
 * `register` et `errors` sont passés aux étapes en **props** plutôt que via
 * `FormProvider` : sous react-hook-form v7, `formState` est un proxy dont
 * l'abonnement est établi par le composant qui appelle `useForm`. Déplacer la
 * lecture des erreurs dans les enfants via `useFormContext` reviendrait à
 * dépendre d'un abonnement établi ici — un couplage invisible que le compilateur
 * ne vérifie pas. Avec des props, ce que chaque étape consomme est explicite et
 * typé.
 */
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
    setError,
    clearErrors,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      document_type: '',
      document_type_free: '',
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

  // Référentiel serveur : types, motifs, et la règle qui les relie.
  const {
    data: options,
    isPending: isLoadingOptions,
    isError: hasOptionsError,
  } = useDocumentOptions();

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
    let valid = await trigger(fieldsForStep);

    // Étape 1 : le superRefine du schéma est court-circuité tant que `parish_id`
    // manque, on applique donc la règle « Autre ⇒ précision » explicitement.
    if (step === 'document') {
      clearErrors(['document_type_free', 'reason_free']);
      const issues = precisionIssues(getValues());
      for (const issue of issues) {
        setError(issue.path, { type: 'manual', message: issue.message });
      }
      if (issues.length > 0) valid = false;
    }

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

  function onSubmit(values: FormValues) {
    if (!values.consent_given) return;
    mutate(buildCreateDocumentPayload(values), {
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

  /**
   * Types proposés — servis par le backend. Tant qu'ils n'ont pas été reçus la
   * liste est vide : on affiche alors un état de chargement ou d'erreur explicite
   * (voir l'étape 1) plutôt qu'une étape muette qui semblerait sans options.
   */
  const documentTypeOptions = options?.document_types ?? [];

  const selectedTypeOption = documentTypeOptions.find(
    (t) => t.value === watchedDocumentType,
  );

  /** « Autre document » exige une précision libre. */
  const typeRequiresPrecision = selectedTypeOption
    ? selectedTypeOption.requires_precision
    : watchedDocumentType === 'other';

  /**
   * Motifs recevables pour le type choisi. Sans référentiel (chargement, réseau),
   * on n'invente pas de filtre : tous les motifs restent proposés et c'est le
   * serveur — seule autorité sur cette règle — qui tranchera.
   */
  const reasonOptions = React.useMemo(() => {
    if (!options) return [];
    const allowed = selectedTypeOption?.allowed_reasons;
    if (!allowed) return options.reasons;
    return options.reasons.filter((r) => allowed.includes(r.value));
  }, [options, selectedTypeOption]);

  /**
   * Changement de type : un motif devenu incompatible est RÉINITIALISÉ, jamais
   * conservé en douce — sinon le formulaire enverrait une combinaison que le
   * serveur rejette, avec un motif que l'utilisateur ne voit même plus affiché.
   */
  function handleSelectDocumentType(value: string) {
    setValue('document_type', value, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (value !== 'other') {
      setValue('document_type_free', '');
    }

    const allowed = documentTypeOptions.find(
      (t) => t.value === value,
    )?.allowed_reasons;
    const currentReason = getValues('reason');
    if (allowed && currentReason && !allowed.includes(currentReason)) {
      setValue('reason', '', { shouldValidate: false, shouldDirty: true });
      setValue('reason_free', '');
    }
  }

  function handleSelectReason(value: string) {
    setValue('reason', value, { shouldValidate: true, shouldDirty: true });
    if (value !== 'other') {
      setValue('reason_free', '');
    }
  }

  function handleToggleConsent() {
    setValue('consent_given', !watchedConsentGiven, { shouldDirty: true });
  }

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

          {step === 'document' && (
            <DocumentStep
              documentTypeOptions={documentTypeOptions}
              reasonOptions={reasonOptions}
              isLoadingOptions={isLoadingOptions}
              hasOptionsError={hasOptionsError}
              selectedType={watchedDocumentType}
              selectedReason={watchedReason}
              requiresTypePrecision={typeRequiresPrecision}
              onSelectType={handleSelectDocumentType}
              onSelectReason={handleSelectReason}
              register={register}
              errors={errors}
            />
          )}

          {step === 'parish' && (
            <ParishStep
              pickedParish={pickedParish}
              onPickParish={handlePickParish}
              errors={errors}
            />
          )}

          {step === 'details' && (
            <DetailsStep
              documentType={watchedDocumentType}
              register={register}
              errors={errors}
              attachment={{
                fileName,
                fileError,
                isUploading,
                isUploaded: watchedAttachmentId != null,
                onSelectFile: handleSelectFile,
                onClear: handleClearFile,
              }}
            />
          )}

          {step === 'review' && (
            <ReviewStep
              values={recap}
              documentTypeOptions={documentTypeOptions}
              reasons={options?.reasons ?? []}
              pickedParish={pickedParish}
              fileName={fileName}
              consentGiven={watchedConsentGiven}
              onToggleConsent={handleToggleConsent}
              onEditStep={setStepIndex}
              errors={errors}
            />
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
