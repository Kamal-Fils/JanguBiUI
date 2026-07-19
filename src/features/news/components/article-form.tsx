'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { ParishSelector } from '@/components/org/parish-selector';
import { Button } from '@/components/ui/button/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor/rich-text-editor';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useChurches } from '@/lib/org/get-churches';
import { useDioceses } from '@/lib/org/get-dioceses';

import { useCategories } from '../api/get-categories';
import { useUploadCoverImage } from '../api/upload-cover-image';
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
  { value: 'church', label: 'Église (une seule église de la paroisse)' },
];

const articleFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  content: z.string().min(1, 'Le contenu est requis'),
  // L'éditeur riche (TipTap) produit du HTML — re-sanitizé côté serveur (nh3).
  content_format: z.enum(['text', 'html']).default('html'),
  excerpt: z.string().max(400).optional(),
  category_id: z.coerce.number().min(1, 'La catégorie est requise'),
  content_type: z.enum(['announcement', 'article', 'pastoral_letter']),
  // Annonces : date du jour concerné (bloc « Annonces du dimanche »).
  announcement_date: z.string().nullable().optional(),
  cover_image_id: z.number().nullable().optional(),
  scope_type: z.enum(['global', 'diocese', 'parish', 'church']),
  scope_parish_id: z.coerce.number().nullable().optional(),
  scope_diocese_id: z.coerce.number().nullable().optional(),
  // Le serveur accepte la portée « église » depuis le chantier hiérarchie
  // (modèle, index et sérialiseurs d'entrée/sortie), mais le formulaire ne la
  // proposait pas : une paroisse à plusieurs églises ne pouvait pas adresser
  // une annonce à une seule d'entre elles.
  scope_church_id: z.coerce.number().nullable().optional(),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface ArticleFormProps {
  defaultValues?: Partial<ArticleFormValues>;
  /** URL de la bannière existante (page édition) — pour l'aperçu initial. */
  defaultCoverUrl?: string | null;
  onSubmit: (data: ArticleFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ArticleForm({
  defaultValues,
  defaultCoverUrl,
  onSubmit,
  isSubmitting,
  submitLabel = 'Enregistrer',
}: ArticleFormProps) {
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: dioceses = [], isLoading: diocesesLoading } = useDioceses();
  const { mutate: uploadCover, isPending: isUploadingCover } =
    useUploadCoverImage();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    defaultCoverUrl ?? null,
  );

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      content_type: 'article',
      content_format: 'html',
      scope_type: 'global',
      ...defaultValues,
    },
  });

  const scopeType = watch('scope_type');
  const contentType = watch('content_type');

  // Paroisse servant UNIQUEMENT à filtrer la liste des églises : elle n'est pas
  // envoyée au serveur, qui déduit la paroisse de l'église choisie.
  const [churchParishId, setChurchParishId] = useState<number | null>(
    defaultValues?.scope_parish_id ?? null,
  );
  const { data: churches = [], isLoading: churchesLoading } = useChurches({
    parishId: churchParishId ?? undefined,
  });

  function handleCoverSelected(file: File | undefined) {
    if (!file) return;
    uploadCover(file, {
      onSuccess: ({ id }) => {
        setValue('cover_image_id', id, { shouldDirty: true });
        setCoverPreview(URL.createObjectURL(file));
      },
    });
  }

  function clearCover() {
    setValue('cover_image_id', null, { shouldDirty: true });
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  }

  const submitNormalized = handleSubmit((data) =>
    onSubmit({
      ...data,
      // TipTap produit toujours du HTML (re-sanitizé côté serveur par nh3) —
      // y compris quand on ré-édite un ancien article « texte brut ».
      content_format: 'html',
      // La date d'annonce ne part que pour une annonce ; '' (input vide) → null.
      announcement_date:
        data.content_type === 'announcement' && data.announcement_date
          ? data.announcement_date
          : null,
    }),
  );

  return (
    <form onSubmit={submitNormalized} className="space-y-6">
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
            Diocèse <span className="text-destructive">*</span>
          </label>
          <select
            id="form-diocese-id"
            {...register('scope_diocese_id')}
            disabled={diocesesLoading}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          >
            <option value="">Sélectionner un diocèse</option>
            {dioceses.map((diocese) => (
              <option key={diocese.id} value={diocese.id}>
                {diocese.name}
              </option>
            ))}
          </select>
          {errors.scope_diocese_id && (
            <p className="text-xs text-destructive">
              {errors.scope_diocese_id.message}
            </p>
          )}
        </div>
      )}

      {scopeType === 'parish' && (
        <div className="space-y-2">
          <label
            htmlFor="form-parish-id"
            className="block text-sm font-medium text-foreground"
          >
            Paroisse <span className="text-destructive">*</span>
          </label>
          <Controller
            control={control}
            name="scope_parish_id"
            render={({ field }) => (
              <ParishSelector
                value={field.value ?? null}
                onChange={(parishId) => field.onChange(parishId)}
              />
            )}
          />
          {errors.scope_parish_id && (
            <p className="text-xs text-destructive">
              {errors.scope_parish_id.message}
            </p>
          )}
        </div>
      )}

      {scopeType === 'church' && (
        <div className="space-y-4 rounded-lg border border-border bg-background-surface p-4">
          {/* Une église se désigne toujours à travers sa paroisse : la liste
              plate de toutes les églises du pays serait inexploitable. */}
          {/* Pas de <label> ici : `ParishSelector` est une cascade qui porte
              déjà ses propres libellés associés (province, diocèse, paroisse).
              Un label supplémentaire serait redondant à la lecture d'écran et
              ne pourrait viser aucun contrôle unique. */}
          <div
            role="group"
            aria-label="Paroisse de rattachement"
            className="space-y-2"
          >
            <ParishSelector
              value={churchParishId}
              onChange={(parishId) => {
                setChurchParishId(parishId);
                // Changer de paroisse invalide l'église choisie : la conserver
                // enverrait une église qui n'appartient plus à la paroisse.
                setValue('scope_church_id', null, { shouldDirty: true });
              }}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="form-church-id"
              className="block text-sm font-medium text-foreground"
            >
              Église <span className="text-destructive">*</span>
            </label>
            <select
              id="form-church-id"
              {...register('scope_church_id')}
              disabled={!churchParishId || churchesLoading}
              className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              <option value="">
                {churchParishId
                  ? 'Sélectionner une église'
                  : "Choisissez d'abord une paroisse"}
              </option>
              {churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name}
                </option>
              ))}
            </select>
            {churchParishId && !churchesLoading && churches.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Cette paroisse n&apos;a aucune église enregistrée.
              </p>
            )}
            {errors.scope_church_id && (
              <p className="text-xs text-destructive">
                {errors.scope_church_id.message}
              </p>
            )}
          </div>
        </div>
      )}

      {contentType === 'announcement' && (
        <div className="space-y-2">
          <label
            htmlFor="form-announcement-date"
            className="block text-sm font-medium text-foreground"
          >
            Date de l&apos;annonce
          </label>
          <input
            id="form-announcement-date"
            type="date"
            {...register('announcement_date')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Pour une annonce du dimanche, indiquez la date du dimanche
            concerné : elle sera mise en avant dans le fil.
          </p>
        </div>
      )}

      {/* Bannière (image de couverture) — affichée en tête d'article et dans
          le fil, à la manière d'un journal. */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          Image de bannière
        </span>
        {coverPreview ? (
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border">
            <div className="relative aspect-video w-full">
              <Image
                src={coverPreview}
                alt="Aperçu de la bannière"
                fill
                unoptimized
                className="object-cover"
                sizes="448px"
              />
            </div>
            <button
              type="button"
              onClick={clearCover}
              aria-label="Retirer la bannière"
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="flex w-full max-w-md flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground disabled:opacity-60"
          >
            {isUploadingCover ? (
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            {isUploadingCover
              ? 'Envoi de l’image…'
              : 'Ajouter une image de bannière'}
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleCoverSelected(e.target.files?.[0])}
        />
      </div>

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
        <span className="block text-sm font-medium text-foreground">
          Contenu <span className="text-destructive">*</span>
        </span>
        {/* Éditeur riche « comme Word » (retour testeurs n°3) — plus besoin
            d'écrire du HTML à la main dans un textarea. */}
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <RichTextEditor
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
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
