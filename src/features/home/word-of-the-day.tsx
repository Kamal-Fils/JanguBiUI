'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { normalizeReadingLabel } from '@/utils/reading-labels';

import { useDailyReadings } from './api/get-daily-readings';
import { getLiturgicalTone } from './utils/liturgical-color';

/**
 * Ouverture de l'accueil du fidèle.
 *
 * Parti pris : **la Parole du jour est le sujet de la page**, pas le prénom de
 * l'utilisateur. Personne n'ouvre l'application pour se voir salué ; on
 * l'ouvre pour la lecture du jour, désignée comme l'ancre de rétention du
 * produit. La salutation devient donc une ligne de contexte au-dessus, et
 * l'Écriture prend l'échelle.
 *
 * La page s'habille de la **couleur liturgique** du temps (violet, blanc/or,
 * rouge, vert) : un signe que tout fidèle sait lire, qui change au fil de
 * l'année sans qu'on publie quoi que ce soit.
 */
export function WordOfTheDay() {
  const { data: user } = useUser();
  const { data, isPending } = useDailyReadings();

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user?.profile?.first_name ?? '';

  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const tone = getLiturgicalTone(data?.season);

  // L'alléluia est une acclamation, pas une lecture à lister.
  const readings = (data?.readings ?? []).filter((r) => {
    const label = normalizeReadingLabel(r.type ?? '');
    return (r.type || r.citation) && !/all[eé]luia/i.test(label);
  });

  // L'Évangile porte le jour : on le met en exergue, le reste suit.
  const gospel = readings.find((r) =>
    /[eé]vangile/i.test(normalizeReadingLabel(r.type ?? '')),
  );
  const others = readings.filter((r) => r !== gospel);

  return (
    <section
      aria-labelledby="parole-du-jour"
      className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-soft-lg"
    >
      {/* Lavis de la couleur liturgique — décoratif, jamais porteur de sens seul */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b',
          tone.washClass,
        )}
      />
      {/* Filet vertical de la couleur du temps, à gauche */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: `hsl(${tone.accentVar} / 0.55)` }}
      />

      <div className="relative bg-paper px-5 py-8 sm:px-10 sm:py-12">
        {/* Contexte : salutation + date + temps liturgique */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm text-muted-foreground">
            {greeting}
            {firstName ? ` ${firstName},` : ','}
          </p>
          <p className="text-sm capitalize text-muted-foreground/80">
            {dateStr}
          </p>
        </div>

        <p
          className={cn(
            'mt-6 text-[11px] font-semibold uppercase tracking-[0.22em]',
            tone.inkClass,
          )}
        >
          {tone.label}
          {data?.day_name ? ` · ${data.day_name}` : ''}
        </p>

        <h1
          id="parole-du-jour"
          className="mt-2 font-serif text-display font-black leading-[0.95] tracking-tight text-foreground"
        >
          La Parole du jour
        </h1>

        <div className="hairline-gold mt-6 max-w-xs" aria-hidden="true" />

        {isPending ? (
          <div className="mt-8 flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : readings.length === 0 ? (
          <p className="mt-8 max-w-prose text-sm text-muted-foreground">
            Les lectures du jour ne sont pas encore disponibles. Elles arrivent
            chaque nuit ;{' '}
            <Link
              href={paths.app.spirituelLiturgie.getHref()}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              ouvrir la liturgie
            </Link>{' '}
            pour consulter un autre jour.
          </p>
        ) : (
          <>
            {gospel && (
              <Link
                href={paths.app.spirituelLiturgie.getHref()}
                className="group mt-8 block"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Évangile
                </span>
                <span className="mt-1.5 block font-serif text-headline font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {gospel.citation || 'Évangile du jour'}
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Lire l’Évangile
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )}

            {others.length > 0 && (
              <ul className="mt-8 flex flex-col divide-y divide-border/50 border-t border-border/50">
                {others.map((reading) => (
                  <li key={reading.id}>
                    <Link
                      href={paths.app.spirituelLiturgie.getHref()}
                      className="group flex items-baseline justify-between gap-4 py-3"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {normalizeReadingLabel(reading.type ?? '') || 'Lecture'}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right font-serif text-sm text-foreground/90 transition-colors group-hover:text-primary">
                        {reading.citation}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
