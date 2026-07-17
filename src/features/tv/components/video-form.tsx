'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/button';

import { useCreateVideo } from '../api/create-video';
import { useUpdateVideo } from '../api/update-video';
import type { TvCategory, TvVideo } from '../types';

const videoSchema = z.object({
  title: z.string().optional(),
  youtube_url: z.string().url('URL YouTube invalide'),
  category_slug: z.string().min(1, 'La catégorie est requise'),
  is_live: z.boolean().default(false),
  is_pinned_live: z.boolean().default(false),
});

type VideoFormValues = z.infer<typeof videoSchema>;

interface VideoFormProps {
  categories: TvCategory[];
  /** Vidéo à éditer ; absent => création. */
  video?: TvVideo;
  onSuccess: () => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-soft-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labelClass = 'block text-sm font-medium text-foreground';
const errorClass = 'text-xs text-destructive';
const checkboxClass =
  'size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function VideoForm({
  categories,
  video,
  onSuccess,
  onCancel,
}: VideoFormProps) {
  const isEditing = Boolean(video);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: video?.title ?? '',
      youtube_url: video?.youtube_url ?? '',
      category_slug: video?.category.slug ?? '',
      is_live: video?.is_live ?? false,
      is_pinned_live: video?.is_pinned_live ?? false,
    },
  });

  const handleMutationSuccess = () => {
    reset();
    onSuccess();
  };

  const { mutate: createVideo, isPending: creating } = useCreateVideo({
    onSuccess: handleMutationSuccess,
  });
  const { mutate: updateVideo, isPending: updating } = useUpdateVideo({
    onSuccess: handleMutationSuccess,
  });
  const isPending = creating || updating;

  const onSubmit = (data: VideoFormValues) => {
    if (video) {
      updateVideo({ videoId: video.id, ...data });
    } else {
      createVideo(data);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-soft-sm sm:p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {isEditing ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
      </p>

      <div className="space-y-1.5">
        <label htmlFor="video-title" className={labelClass}>
          Titre{' '}
          <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        <input
          id="video-title"
          type="text"
          placeholder="Ex : Messe du dimanche des Rameaux"
          className={inputClass}
          {...register('title')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="video-url" className={labelClass}>
          URL YouTube <span className="text-destructive">*</span>
        </label>
        <input
          id="video-url"
          type="url"
          placeholder="https://youtube.com/…"
          aria-invalid={errors.youtube_url ? true : undefined}
          className={inputClass}
          {...register('youtube_url')}
        />
        {errors.youtube_url && (
          <p className={errorClass} role="alert">
            {errors.youtube_url.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="video-category" className={labelClass}>
          Catégorie <span className="text-destructive">*</span>
        </label>
        <select
          id="video-category"
          aria-invalid={errors.category_slug ? true : undefined}
          className={inputClass}
          {...register('category_slug')}
        >
          <option value="">Choisir une catégorie…</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_slug && (
          <p className={errorClass} role="alert">
            {errors.category_slug.message}
          </p>
        )}
      </div>

      <fieldset className="space-y-2.5 rounded-lg border border-border/60 bg-background-surface/60 px-3.5 py-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">
          Diffusion en direct
        </legend>
        <label
          htmlFor="video-is-live"
          className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
        >
          <input
            id="video-is-live"
            type="checkbox"
            className={checkboxClass}
            {...register('is_live')}
          />
          En direct
        </label>
        <label
          htmlFor="video-is-pinned"
          className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
        >
          <input
            id="video-is-pinned"
            type="checkbox"
            className={checkboxClass}
            {...register('is_pinned_live')}
          />
          Épingler en tête de chaîne
        </label>
      </fieldset>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm" isLoading={isPending}>
          {isEditing ? 'Enregistrer' : 'Créer la vidéo'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
