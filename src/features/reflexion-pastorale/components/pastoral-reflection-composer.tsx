'use client';

import { CheckCircle, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useMyTodayReflection } from '../api/get-my-reflection';
import { useSaveReflection } from '../api/save-reflection';

const MAX_CHARS = 500;

export function PastoralReflectionComposer() {
  const { data: existing, isLoading } = useMyTodayReflection();
  const { mutate: save, isPending } = useSaveReflection();

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleStartEditing = () => {
    setContent(existing?.content ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent('');
  };

  const handleSave = () => {
    if (!content.trim()) return;
    save(
      { content: content.trim(), existingId: existing?.id },
      {
        onSuccess: () => {
          setIsEditing(false);
          setContent('');
          setSaved(true);
          savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Pencil className="size-4 text-primary" />
          Réflexion pastorale du jour
        </h2>
        {!isEditing && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleStartEditing}
            className="h-auto p-0"
          >
            {existing ? 'Modifier' : 'Rédiger'}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Partagez une réflexion liée aux lectures du jour…"
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${content.length >= MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {content.length}/{MAX_CHARS}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                icon={<X className="size-3.5" />}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isPending || !content.trim()}
                isLoading={isPending}
                icon={<CheckCircle className="size-3.5" />}
                className="text-xs"
              >
                {isPending ? 'Enregistrement…' : 'Publier'}
              </Button>
            </div>
          </div>
        </div>
      ) : existing ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm leading-relaxed text-foreground italic">
            &ldquo;{existing.content}&rdquo;
          </p>
          {saved && (
            <p className="mt-2 flex items-center gap-1 text-xs text-success">
              <CheckCircle className="size-3" />
              Réflexion publiée
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleStartEditing}
          className="w-full rounded-xl border border-dashed border-border p-6 text-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
          <Pencil className="mx-auto mb-2 size-5 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Partagez une réflexion liée aux lectures du jour
          </p>
        </button>
      )}
    </section>
  );
}
