'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/button';

import { useCreateCategory } from '../api/create-category';

const categorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  order: z.coerce.number().int().min(0).default(0),
  is_clergy_only: z.boolean().default(false),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  onSuccess: () => void;
}

const inputClass =
  'w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-soft-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labelClass = 'block text-sm font-medium text-foreground';
const errorClass = 'text-xs text-destructive';

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', order: 0, is_clergy_only: false },
  });

  const { mutate: createCategory, isPending } = useCreateCategory({
    onSuccess: () => {
      reset();
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => createCategory(data))}
      className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-soft-sm sm:p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        Nouvelle catégorie
      </p>

      <div className="space-y-1.5">
        <label htmlFor="cat-name" className={labelClass}>
          Nom de la catégorie <span className="text-destructive">*</span>
        </label>
        <input
          id="cat-name"
          type="text"
          placeholder="Ex : Enseignements"
          aria-invalid={errors.name ? true : undefined}
          className={inputClass}
          {...register('name')}
        />
        {errors.name && (
          <p className={errorClass} role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cat-order" className={labelClass}>
          Ordre d&apos;affichage{' '}
          <span className="font-normal text-muted-foreground">
            (0 = premier)
          </span>
        </label>
        <input
          id="cat-order"
          type="number"
          className={inputClass}
          {...register('order')}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="cat-clergy-only"
          className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
        >
          <input
            id="cat-clergy-only"
            type="checkbox"
            className="size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('is_clergy_only')}
          />
          Clergé uniquement (Formation)
        </label>
        <p className="pl-7 text-xs text-muted-foreground">
          Les vidéos de cette catégorie ne seront visibles que par les membres
          du clergé.
        </p>
      </div>

      <div className="pt-1">
        <Button type="submit" size="sm" isLoading={isPending}>
          Créer la catégorie
        </Button>
      </div>
    </form>
  );
}
