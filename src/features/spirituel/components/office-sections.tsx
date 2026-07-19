'use client';

import { ReadingSurface } from '@/components/ui/reading-surface';

import type { OfficeSection } from '../utils/normalize-office';

interface OfficeSectionsProps {
  sections: readonly OfficeSection[];
  fontSize: number;
  /** Niveau de titre des parties, selon la profondeur d'imbrication. */
  headingLevel?: 'h3' | 'h4';
}

/**
 * Corps d'un office : hymne, psaumes, cantique, intercessions… rendus dans
 * l'ordre de récitation, chacun sur la surface de lecture partagée.
 */
export function OfficeSections({
  sections,
  fontSize,
  headingLevel: Heading = 'h3',
}: OfficeSectionsProps) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section key={section.key}>
          <Heading className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {section.label}
          </Heading>

          <div className="mt-3 flex flex-col gap-5">
            {section.blocks.map((block, index) => (
              <div key={`${section.key}-${index}`}>
                {block.citation && (
                  <p className="mb-1.5 font-serif text-base font-semibold text-foreground">
                    {block.citation}
                  </p>
                )}
                <ReadingSurface fontSize={fontSize} html={block.html} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
