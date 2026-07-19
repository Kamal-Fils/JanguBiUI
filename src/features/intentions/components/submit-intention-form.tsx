'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form/textarea';
import { cn } from '@/utils/cn';

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

const TYPE_ORDER: IntentionType[] = [
  'for_deceased',
  'for_living',
  'for_occasion',
  'for_community',
];

interface SubmitIntentionFormProps {
  onSuccess?: () => void;
}

/**
 * Dépôt d'une intention de messe — traité comme un **parcours** (DIRECTION.md
 * R1 : on juge le trajet, pas la capture).
 *
 * Le motif est choisi par pastilles visibles d'un seul coup d'œil plutôt que
 * par une liste déroulante : un `<select>` coûte deux gestes (ouvrir le
 * sélecteur natif, choisir) et cache les options ; ici, un seul appui suffit
 * et les quatre motifs sont lisibles d'emblée — ce qui compte pour une cible
 * souvent âgée et peu familière des sélecteurs natifs (R3).
 */
export function SubmitIntentionForm({ onSuccess }: SubmitIntentionFormProps) {
  const {
    mutate: submit,
    isPending,
    isError,
  } = useSubmitIntention({ onSuccess });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { intention_type: 'for_deceased', intention_text: '' },
  });

  const selectedType = watch('intention_type');

  const onSubmit = (data: FormInput) => {
    submit(data, { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Choisissez le motif, puis décrivez votre intention. Elle sera transmise
        au prêtre de votre paroisse pour être portée lors d&apos;une messe.
      </p>

      <fieldset>
        <legend className="mb-2.5 text-sm font-medium text-foreground">
          Type d&apos;intention
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {TYPE_ORDER.map((value) => {
            const meta = INTENTION_TYPE_META[value];
            const Icon = meta.icon;
            const active = selectedType === value;
            return (
              <label
                key={value}
                className={cn(
                  // min-h-[4.5rem] : bien au-delà des 44px requis — c'est le
                  // premier geste du parcours, il ne doit pas se rater.
                  'flex min-h-[4.5rem] cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors',
                  'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background-surface hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  value={value}
                  {...register('intention_type')}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  <Icon aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    'min-w-0 text-sm font-medium',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {meta.label}
                </span>
              </label>
            );
          })}
        </div>
        {errors.intention_type && (
          <p className="mt-2 text-sm font-medium text-destructive" role="alert">
            {errors.intention_type.message}
          </p>
        )}
      </fieldset>

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
        className="h-12 w-full"
        disabled={isPending}
        isLoading={isPending}
      >
        {isPending ? 'Envoi…' : 'Confier mon intention'}
      </Button>
    </form>
  );
}
