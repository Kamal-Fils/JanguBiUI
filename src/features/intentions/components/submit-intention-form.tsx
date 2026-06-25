'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form/select';
import { Textarea } from '@/components/ui/form/textarea';

import { useSubmitIntention } from '../api/submit-intention';
import {
  INTENTION_TYPE_META,
  type IntentionType,
} from './intention-type-label';

const schema = z.object({
  intention_type: z.enum([
    'for_deceased',
    'for_living',
    'for_occasion',
    'for_community',
  ]),
  intention_text: z
    .string()
    .min(10, 'Veuillez décrire votre intention (min. 10 caractères)'),
});

type FormInput = z.infer<typeof schema>;

// Libellés issus de la source unique partagée avec la carte éditoriale.
const TYPE_OPTIONS: { value: IntentionType; label: string }[] = (
  ['for_deceased', 'for_living', 'for_occasion', 'for_community'] as const
).map((value) => ({ value, label: INTENTION_TYPE_META[value].label }));

interface SubmitIntentionFormProps {
  onSuccess?: () => void;
}

export function SubmitIntentionForm({ onSuccess }: SubmitIntentionFormProps) {
  const { mutate: submit, isPending, isError } = useSubmitIntention({ onSuccess });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { intention_type: 'for_deceased', intention_text: '' },
  });

  const onSubmit = (data: FormInput) => {
    submit(data, { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choisissez le motif, puis décrivez votre intention. Elle sera transmise
        au prêtre de votre paroisse pour être portée lors d&apos;une messe.
      </p>

      <Select
        label="Type d'intention"
        options={TYPE_OPTIONS}
        error={errors.intention_type}
        registration={register('intention_type')}
      />

      <Textarea
        label="Votre intention"
        rows={4}
        placeholder="Décrivez votre intention de messe…"
        className="resize-none"
        error={errors.intention_text}
        registration={register('intention_text')}
      />

      {isError && (
        <p className="text-sm font-medium text-destructive" role="alert">
          L&apos;envoi a échoué. Veuillez réessayer.
        </p>
      )}

      <Button
        type="submit"
        variant="gold"
        className="w-full"
        disabled={isPending}
        isLoading={isPending}
      >
        {isPending ? 'Envoi…' : 'Confier mon intention'}
      </Button>
    </form>
  );
}
