'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { ParishSelector } from '@/components/org/parish-selector';
import { Button } from '@/components/ui/button/button';
import { Textarea } from '@/components/ui/form/textarea';

import { CreateTransferInput, useCreateTransfer } from '../api/create-transfer';

const schema = z.object({
  destination_parish_id: z
    .number({
      required_error: 'Veuillez sélectionner une paroisse de destination',
      invalid_type_error: 'Veuillez sélectionner une paroisse de destination',
    })
    .int()
    .positive('Veuillez sélectionner une paroisse de destination'),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TransferRequestFormProps {
  onSuccess: () => void;
}

export function TransferRequestForm({ onSuccess }: TransferRequestFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      destination_parish_id: undefined,
      reason: '',
    },
  });

  const { mutate: createTransfer, isPending } = useCreateTransfer({
    onSuccess: () => {
      reset({ destination_parish_id: undefined, reason: '' });
      onSuccess();
    },
  });

  function onSubmit(values: FormValues) {
    const payload: CreateTransferInput = {
      destination_parish_id: values.destination_parish_id,
      reason: values.reason?.trim() || undefined,
    };
    createTransfer(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div
        role="group"
        aria-labelledby="destination-parish-label"
        aria-describedby={
          errors.destination_parish_id ? 'destination-parish-error' : undefined
        }
      >
        <p
          id="destination-parish-label"
          className="mb-3 text-sm font-medium text-foreground"
        >
          Paroisse de destination <span className="text-destructive">*</span>
        </p>
        <Controller
          control={control}
          name="destination_parish_id"
          render={({ field }) => (
            <ParishSelector
              value={field.value ?? null}
              onChange={(parishId) => field.onChange(parishId ?? undefined)}
              disabled={isPending}
            />
          )}
        />
        {errors.destination_parish_id && (
          <p
            id="destination-parish-error"
            className="mt-2 text-sm font-medium text-destructive"
            role="alert"
          >
            {errors.destination_parish_id.message}
          </p>
        )}
      </div>

      <Textarea
        label="Motif du transfert (optionnel)"
        rows={3}
        disabled={isPending}
        placeholder="Déménagement, mariage, rapprochement familial…"
        className="resize-none"
        error={errors.reason}
        registration={register('reason')}
      />

      <Button
        type="submit"
        isLoading={isPending}
        icon={<Send className="size-4" />}
        disabled={isPending}
        className="h-11 w-full"
      >
        {isPending ? 'Envoi en cours…' : 'Soumettre la demande de transfert'}
      </Button>
    </form>
  );
}
