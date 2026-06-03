'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

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
  'w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

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
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="space-y-1.5">
        <label
          htmlFor="video-title"
          className="block text-xs font-medium text-foreground"
        >
          Titre (optionnel)
        </label>
        <input
          id="video-title"
          type="text"
          placeholder="Titre (optionnel)"
          className={inputClass}
          {...register('title')}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="video-url"
          className="block text-xs font-medium text-foreground"
        >
          URL YouTube
        </label>
        <input
          id="video-url"
          type="url"
          placeholder="https://youtube.com/…"
          className={inputClass}
          {...register('youtube_url')}
        />
        {errors.youtube_url && (
          <p className="text-xs text-destructive">
            {errors.youtube_url.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="video-category"
          className="block text-xs font-medium text-foreground"
        >
          Catégorie
        </label>
        <select
          id="video-category"
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
          <p className="text-xs text-destructive">
            {errors.category_slug.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <label
          htmlFor="video-is-live"
          className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
        >
          <input
            id="video-is-live"
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            {...register('is_live')}
          />
          En direct
        </label>
        <label
          htmlFor="video-is-pinned"
          className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"
        >
          <input
            id="video-is-pinned"
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            {...register('is_pinned_live')}
          />
          Épingler
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Spinner className="size-4" />
          ) : isEditing ? (
            'Modifier'
          ) : (
            'Créer'
          )}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
