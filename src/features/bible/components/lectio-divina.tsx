'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';

import { useSaveLectioSession } from '../api/save-lectio-session';

interface LectioDivinaProps {
  passageId: number;
  initial?: {
    lectio?: string;
    meditatio?: string;
    oratio?: string;
    contemplatio?: string;
  };
}

type FormValues = {
  lectio: string;
  meditatio: string;
  oratio: string;
  contemplatio: string;
};

const STEPS = [
  {
    key: 'lectio' as const,
    label: 'Lectio',
    hint: 'Lisez le texte lentement, plusieurs fois.',
  },
  {
    key: 'meditatio' as const,
    label: 'Meditatio',
    hint: 'Méditez sur ce qui vous touche.',
  },
  {
    key: 'oratio' as const,
    label: 'Oratio',
    hint: 'Priez à partir du texte.',
  },
  {
    key: 'contemplatio' as const,
    label: 'Contemplatio',
    hint: 'Restez en silence devant Dieu.',
  },
];

export function LectioDivina({ passageId, initial }: LectioDivinaProps) {
  const { mutate, isPending } = useSaveLectioSession();

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      lectio: initial?.lectio ?? '',
      meditatio: initial?.meditatio ?? '',
      oratio: initial?.oratio ?? '',
      contemplatio: initial?.contemplatio ?? '',
    },
  });

  useEffect(() => {
    if (initial) reset(initial as FormValues);
  }, [passageId, initial, reset]);

  const onSubmit = (data: FormValues) => {
    mutate({ passage_id: passageId, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {STEPS.map(({ key, label, hint }) => (
        <div key={key}>
          <label
            htmlFor={key}
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            {label}
          </label>
          <p className="text-xs text-gray-400 mb-2">{hint}</p>
          <textarea
            id={key}
            {...register(key)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      ))}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
      </Button>
    </form>
  );
}
