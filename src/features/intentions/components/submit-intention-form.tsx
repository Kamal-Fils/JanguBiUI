'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';

import { useSubmitIntention } from '../api/submit-intention';

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

const TYPE_LABELS = {
  for_deceased: 'Pour un défunt',
  for_living: 'Pour un vivant',
  for_occasion: 'Pour une occasion',
  for_community: 'Pour la communauté',
};

interface SubmitIntentionFormProps {
  onSuccess?: () => void;
}

export function SubmitIntentionForm({ onSuccess }: SubmitIntentionFormProps) {
  const { mutate: submit, isPending } = useSubmitIntention({ onSuccess });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormInput) => {
    submit(data, {
      onSuccess: () => reset(),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="intention-type"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Type d&apos;intention
        </label>
        <select
          id="intention-type"
          {...register('intention_type')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.intention_type && (
          <p className="mt-1 text-xs text-red-500">
            {errors.intention_type.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="intention-text"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Votre intention
        </label>
        <textarea
          id="intention-text"
          {...register('intention_text')}
          rows={4}
          placeholder="Décrivez votre intention de messe…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
        {errors.intention_text && (
          <p className="mt-1 text-xs text-red-500">
            {errors.intention_text.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Envoi…' : 'Soumettre'}
      </Button>
    </form>
  );
}
