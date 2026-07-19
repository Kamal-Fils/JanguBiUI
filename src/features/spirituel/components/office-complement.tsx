'use client';

import { ChevronDown } from 'lucide-react';

import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';

import type { Office } from '../api/get-office';
import { toOfficeSections } from '../utils/normalize-office';

import { OfficeSections } from './office-sections';

interface OfficeEntry {
  /** Office chargé, ou `undefined` si absent / non autorisé. */
  office: Office | undefined;
  label: string;
  hint: string;
}

interface OfficeComplementProps {
  entries: readonly OfficeEntry[];
  fontSize: number;
}

/**
 * Office divin — **complément** à la messe du jour, réservé au clergé et aux
 * religieux.
 *
 * Il ne doit pas concurrencer les lectures : replié par défaut (`<details>`
 * natif, donc accessible au clavier et sans dépendance), sous un filet, avec
 * une échelle inférieure à celle de l'Évangile. Le lien mène aux sept offices
 * complets — ici on n'expose que Laudes et Vêpres, les deux heures majeures.
 */
export function OfficeComplement({ entries, fontSize }: OfficeComplementProps) {
  const available = entries.filter(
    (entry): entry is OfficeEntry & { office: Office } => Boolean(entry.office),
  );

  if (available.length === 0) return null;

  return (
    <section aria-labelledby="office-divin" className="mt-16">
      <div className="hairline-gold mb-6" aria-hidden="true" />

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Réservé au clergé
          </p>
          <h2
            id="office-divin"
            className="mt-1 font-serif text-title font-bold tracking-tight text-foreground"
          >
            Office divin
          </h2>
        </div>
        <Link
          href={paths.app.spirituelHeures.getHref()}
          className="text-base font-medium text-primary underline-offset-4 hover:underline"
        >
          Les 7 offices
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {available.map(({ office, label, hint }) => (
          <details
            key={label}
            className="group overflow-hidden rounded-2xl border border-border/70 bg-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
              <span className="min-w-0">
                <span className="block font-serif text-base font-bold text-foreground">
                  {label}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {hint}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>

            <div className="border-t border-border/70 px-5 py-6">
              <OfficeSections
                sections={toOfficeSections(office)}
                fontSize={fontSize}
                headingLevel="h4"
              />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
