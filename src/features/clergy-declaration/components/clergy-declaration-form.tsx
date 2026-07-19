'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Upload } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ParishPicker, type PickedParish } from '@/components/org/parish-picker';
import { Button } from '@/components/ui/button/button';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import { Label } from '@/components/ui/form/label';
import { Select } from '@/components/ui/form/select';
import { useNotifications } from '@/components/ui/notifications';
import { Textarea } from '@/components/ui/textarea';
import { ROLE_LABELS } from '@/config/roles';

import { CLERGY_CLAIMABLE_ROLES } from '../api/get-my-clergy-declaration';
import { useSubmitClergyDeclaration } from '../api/submit-clergy-declaration';
import { useUploadJustificationFile } from '../api/upload-justification-file';

const MAX_MESSAGE_LENGTH = 2000;

const schema = z.object({
  // `errorMap` et non `required_error` : l'option de garde vaut chaîne vide, ce
  // qui produit une valeur INVALIDE (et non absente) — le message dédié aux
  // champs requis ne serait alors jamais affiché.
  claimedPastoralRole: z.enum(CLERGY_CLAIMABLE_ROLES, {
    errorMap: () => ({ message: 'Choisissez le rôle que vous exercez.' }),
  }),
  message: z.string().max(MAX_MESSAGE_LENGTH).optional(),
});

type FormInput = z.infer<typeof schema>;

interface ClergyDeclarationFormProps {
  /** Une demande refusée a précédé celle-ci : on annonce une nouvelle tentative. */
  isResubmission?: boolean;
}

export function ClergyDeclarationForm({
  isResubmission = false,
}: ClergyDeclarationFormProps) {
  const [parish, setParish] = useState<PickedParish | null>(null);
  const [fileId, setFileId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{
    parish?: string;
    file?: string;
  }>({});

  const { addNotification } = useNotifications();
  const upload = useUploadJustificationFile();
  const submit = useSubmitClergyDeclaration();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFieldErrors((prev) => ({ ...prev, file: undefined }));
    setFileId(null);
    setFileName(file.name);
    // Le fichier doit être téléversé AVANT la soumission : le serveur refuse
    // tout justificatif dont l'upload n'est pas terminé (`upload_finished_at`).
    upload.mutate(file, {
      onSuccess: (res) => setFileId(res.id),
      onError: () => {
        setFileName('');
        setFieldErrors((prev) => ({
          ...prev,
          file: "Le téléversement a échoué. Réessayez.",
        }));
      },
    });
  };

  const onSubmit = (values: FormInput) => {
    const nextErrors: { parish?: string; file?: string } = {};
    if (!parish) nextErrors.parish = 'Choisissez votre paroisse de rattachement.';
    if (!fileId) nextErrors.file = 'Joignez une pièce justificative.';
    setFieldErrors(nextErrors);
    if (!parish || !fileId) return;

    submit.mutate(
      {
        claimedPastoralRole: values.claimedPastoralRole,
        parishId: parish.id,
        justificationFileId: fileId,
        message: values.message,
      },
      {
        onSuccess: () =>
          addNotification({
            type: 'success',
            title: 'Demande envoyée',
            message: 'Votre autorité hiérarchique a été notifiée.',
          }),
        onError: () =>
          addNotification({
            type: 'error',
            title: 'Envoi impossible',
            message:
              "Votre demande n'a pas pu être enregistrée. Vérifiez les informations et réessayez.",
          }),
      },
    );
  };

  return (
    <Card variant="sacred" className="p-6">
      <CardEyebrow className="text-xs text-secondary-foreground dark:text-primary">
        {isResubmission ? 'Nouvelle demande' : 'Déclaration'}
      </CardEyebrow>
      <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground">
        Déclarer mon ministère
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Votre demande sera examinée par votre autorité hiérarchique. Elle
        n’ouvre aucun accès tant qu’elle n’a pas été approuvée.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" noValidate>
        {/* Select natif (couche form du design system) plutôt qu'une liste
            déroulante scriptée : sur un téléphone modeste il ouvre le sélecteur
            du système — cible large, zoom conservé, aucun survol requis (R3). */}
        <Select
          label="Rôle exercé"
          error={errors.claimedPastoralRole}
          className="h-11"
          defaultValue=""
          options={[
            { label: 'Choisir un rôle…', value: '' },
            ...CLERGY_CLAIMABLE_ROLES.map((role) => ({
              label: ROLE_LABELS[role],
              value: role,
            })),
          ]}
          registration={register('claimedPastoralRole')}
        />

        <div>
          <Label>Paroisse de rattachement</Label>
          <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
            Elle détermine l’autorité qui examinera votre demande.
          </p>
          <ParishPicker value={parish} onChange={setParish} />
          {fieldErrors.parish && (
            <p className="mt-1.5 text-sm text-destructive" role="alert">
              {fieldErrors.parish}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="justification">Pièce justificative</Label>
          <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
            Lettre d’obédience, attestation d’ordination, ou tout document établi
            par votre diocèse.
          </p>
          <input
            id="justification"
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            className="block w-full min-h-11 cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
          {upload.isPending && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Upload className="size-3.5" aria-hidden="true" />
              Téléversement de « {fileName} »…
            </p>
          )}
          {fileId !== null && (
            <p className="mt-1.5 text-sm text-success">
              « {fileName} » joint à la demande.
            </p>
          )}
          {fieldErrors.file && (
            <p className="mt-1.5 text-sm text-destructive" role="alert">
              {fieldErrors.file}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="declaration-message">
            Précisions <span className="text-muted-foreground">(facultatif)</span>
          </Label>
          <Textarea
            id="declaration-message"
            rows={4}
            maxLength={MAX_MESSAGE_LENGTH}
            className="mt-1.5"
            placeholder="Année d’ordination, diocèse d’incardination, communauté…"
            {...register('message')}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          isLoading={submit.isPending}
          disabled={upload.isPending}
          icon={<Send className="size-4" aria-hidden="true" />}
        >
          Envoyer ma demande
        </Button>
      </form>
    </Card>
  );
}
