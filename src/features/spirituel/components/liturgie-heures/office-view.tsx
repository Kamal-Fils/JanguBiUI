'use client';

import DOMPurify from 'isomorphic-dompurify';
import { BookOpen } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { OfficeKey, useOffice } from '../../api/get-office';

const safe = (html: string) => DOMPurify.sanitize(html);

interface OfficeViewProps {
  officeKey: OfficeKey;
}

export function OfficeView({ officeKey }: OfficeViewProps) {
  const { data: office, isLoading, isError, error } = useOffice(officeKey);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    const isAuthError =
      error instanceof Error &&
      (error.message.includes('401') || error.message.includes('403'));
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-destructive">
          {isAuthError
            ? 'Accès réservé au clergé et aux religieux.'
            : 'Impossible de charger cet office. Veuillez réessayer.'}
        </p>
      </div>
    );
  }

  if (!office) return null;

  return (
    <div className="space-y-6">
      {office.intro && (
        <div
          className="prose prose-sm max-w-none rounded-xl bg-muted/50 p-4 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: safe(office.intro) }}
        />
      )}

      {office.hymns && office.hymns.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-4" />
            Hymne
          </h3>
          {office.hymns.map((hymn, i) => (
            <div
              key={i}
              className="prose prose-sm max-w-none rounded-xl border border-border bg-card p-4 text-foreground"
              dangerouslySetInnerHTML={{ __html: safe(hymn.text) }}
            />
          ))}
        </section>
      )}

      {office.psalms && office.psalms.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-4" />
            Psaumes
          </h3>
          <div className="space-y-3">
            {office.psalms.map((psalm, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4"
              >
                {psalm.citation && (
                  <p className="mb-2 text-xs font-medium text-primary">
                    {psalm.citation}
                    {psalm.title ? ` — ${psalm.title}` : ''}
                  </p>
                )}
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: safe(psalm.text) }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {office.intercessions && office.intercessions.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Intercessions
          </h3>
          <div className="space-y-2">
            {office.intercessions.map((item, i) => (
              <div
                key={i}
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: safe(item.text) }}
              />
            ))}
          </div>
        </section>
      )}

      {office.conclusion && (
        <div
          className="prose prose-sm max-w-none rounded-xl bg-muted/50 p-4 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: safe(office.conclusion) }}
        />
      )}
    </div>
  );
}
