'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';

import { useCategories } from '../api/get-categories';
import { ContentType } from '../types';

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'announcement', label: 'Annonce' },
  { value: 'pastoral_letter', label: 'Lettre Pastorale' },
];

const SCOPE_OPTIONS = [
  { value: 'global', label: "Global (toute l'Église du Sénégal)" },
  { value: 'diocese', label: 'Diocèse' },
  { value: 'parish', label: 'Paroisse' },
];

const articleFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  content: z.string().min(1, 'Le contenu est requis'),
  excerpt: z.string().max(400).optional(),
  category_id: z.coerce.number().min(1, 'La catégorie est requise'),
  content_type: z.enum(['announcement', 'article', 'pastoral_letter']),
  scope_type: z.enum(['global', 'diocese', 'parish']),
  scope_parish_id: z.coerce.number().nullable().optional(),
  scope_diocese_id: z.coerce.number().nullable().optional(),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface ArticleFormProps {
  defaultValues?: Partial<ArticleFormValues>;
  onSubmit: (data: ArticleFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ArticleForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Enregistrer',
}: ArticleFormProps) {
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      content_type: 'article',
      scope_type: 'global',
      ...defaultValues,
    },
  });

  const scopeType = watch('scope_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="form-title"
          className="block text-sm font-medium text-foreground"
        >
          Titre <span className="text-destructive">*</span>
        </label>
        <input
          id="form-title"
          {...register('title')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Titre de l'article"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="form-content-type"
            className="block text-sm font-medium text-foreground"
          >
            Type de contenu <span className="text-destructive">*</span>
          </label>
          <select
            id="form-content-type"
            {...register('content_type')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {CONTENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="form-category"
            className="block text-sm font-medium text-foreground"
          >
            Catégorie <span className="text-destructive">*</span>
          </label>
          <select
            id="form-category"
            {...register('category_id')}
            disabled={categoriesLoading}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-xs text-destructive">
              {errors.category_id.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="form-scope"
          className="block text-sm font-medium text-foreground"
        >
          Portée <span className="text-destructive">*</span>
        </label>
        <select
          id="form-scope"
          {...register('scope_type')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {SCOPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {scopeType === 'diocese' && (
        <div className="space-y-2">
          <label
            htmlFor="form-diocese-id"
            className="block text-sm font-medium text-foreground"
          >
            ID Diocèse
          </label>
          <input
            id="form-diocese-id"
            type="number"
            {...register('scope_diocese_id')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="ID du diocèse"
          />
        </div>
      )}

      {scopeType === 'parish' && (
        <div className="space-y-2">
          <label
            htmlFor="form-parish-id"
            className="block text-sm font-medium text-foreground"
          >
            ID Paroisse
          </label>
          <input
            id="form-parish-id"
            type="number"
            {...register('scope_parish_id')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="ID de la paroisse"
          />
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="form-excerpt"
          className="block text-sm font-medium text-foreground"
        >
          Résumé court
        </label>
        <textarea
          id="form-excerpt"
          {...register('excerpt')}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Résumé court affiché dans la liste d'articles (max 400 caractères)"
        />
        {errors.excerpt && (
          <p className="text-xs text-destructive">{errors.excerpt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="form-content"
          className="block text-sm font-medium text-foreground"
        >
          Contenu <span className="text-destructive">*</span>
        </label>
        <textarea
          id="form-content"
          {...register('content')}
          rows={12}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Contenu de l'article..."
        />
        {errors.content && (
          <p className="text-xs text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(paths.app.admin.articles.getHref())}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="size-4" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
