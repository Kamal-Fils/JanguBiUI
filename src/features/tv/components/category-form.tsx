'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

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
  'w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

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
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="space-y-1.5">
        <label
          htmlFor="cat-name"
          className="block text-xs font-medium text-foreground"
        >
          Nom de la catégorie
        </label>
        <input
          id="cat-name"
          type="text"
          placeholder="Nom de la catégorie"
          className={inputClass}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="cat-order"
          className="block text-xs font-medium text-foreground"
        >
          Ordre (0 = premier)
        </label>
        <input
          id="cat-order"
          type="number"
          className={inputClass}
          {...register('order')}
        />
      </div>

      <label
        htmlFor="cat-clergy-only"
        className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
      >
        <input
          id="cat-clergy-only"
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
          {...register('is_clergy_only')}
        />
        Clergé uniquement (Formation)
      </label>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Spinner className="size-4" /> : 'Créer'}
      </Button>
    </form>
  );
}
