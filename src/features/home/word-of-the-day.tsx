'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { getLiturgicalTone } from '@/utils/liturgical-color';
import { normalizeReadingLabel } from '@/utils/reading-labels';

import { useDailyReadings } from './api/get-daily-readings';

/**
 * Ouverture de l'accueil du fidèle.
 *
 * Parti pris : **la Parole du jour est le geste quotidien qui fait revenir**,
 * pas le prénom de l'utilisateur. Personne n'ouvre l'application pour se voir
 * salué. La salutation devient donc une ligne de contexte, et l'Écriture prend
 * l'échelle (`text-display`, cf. DIRECTION R2).
 *
 * Le registre est **bleu** : le bleu Jàngu Bi est l'identité décidée par le
 * propriétaire, donc il tient l'ouverture — dégradé de surface, filet vertical,
 * bouton d'action pleine couleur.
 *
 * La **couleur liturgique** reste un marqueur discret (DIRECTION R4) : une
 * pastille et un surtitre, jamais un lavis. Une première version lavait tout le
 * héros de la couleur du temps et mangeait le bleu — à ne pas refaire. Elle ne
 * porte par ailleurs jamais seule une information (WCAG 1.4.1) : le nom du
 * temps est toujours écrit à côté de la pastille.
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
      className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-card shadow-soft-lg"
    >
      {/* Le bleu Jàngu Bi habille l'ouverture — décoratif, jamais porteur de sens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-2xl"
      />
      {/* Filet vertical : signature de marque, à la couleur de l'identité */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-primary"
      />

      <div className="relative px-5 py-8 sm:px-10 sm:py-12">
        {/* Contexte : salutation + date */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm text-muted-foreground">
            {greeting}
            {firstName ? ` ${firstName},` : ','}
          </p>
          <p className="text-sm capitalize text-muted-foreground">{dateStr}</p>
        </div>

        {/* Marqueur liturgique : une pastille et un mot, pas un lavis */}
        <p className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
          <span
            aria-hidden="true"
            className={cn('size-2 shrink-0 rounded-full', tone.dotClass)}
          />
          <span className={tone.inkClass}>
            {tone.label}
            {data?.day_name ? ` · ${data.day_name}` : ''}
          </span>
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
                {/* Action pleine couleur : le bleu porte le geste (R1, R3 ≥44px) */}
                <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition-colors group-hover:bg-primary/90">
                  Lire l’Évangile
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )}

            {others.length > 0 && (
              <ul className="mt-8 flex flex-col divide-y divide-border/60 border-t border-border/60">
                {others.map((reading) => (
                  <li key={reading.id}>
                    <Link
                      href={paths.app.spirituelLiturgie.getHref()}
                      className="group flex min-h-11 items-center justify-between gap-4 py-3"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {normalizeReadingLabel(reading.type ?? '') || 'Lecture'}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right font-serif text-sm text-foreground transition-colors group-hover:text-primary">
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
