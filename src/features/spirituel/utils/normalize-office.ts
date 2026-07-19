/** Un bloc de texte d'office : HTML brut + référence optionnelle. */
export interface OfficeBlock {
  /** Référence affichée au-dessus du bloc (ex. « Psaume 62 — Au désert »). */
  citation?: string;
  /** HTML brut — assaini à l'affichage par `ReadingSurface` (DOMPurify). */
  html: string;
}

/** Une partie de l'office (Hymne, Psaumes, Intercessions…). */
export interface OfficeSection {
  key: string;
  label: string;
  blocks: OfficeBlock[];
}

/**
 * Le backend liturgie n'a pas une forme unique : selon l'office et ce que
 * l'AELF a renvoyé, une même clé arrive tantôt en chaîne HTML, tantôt en
 * liste d'objets `{citation, title, text}`, tantôt en liste de chaînes. Le
 * contrat OpenAPI lui-même type `psalms` et `readings` en `unknown`.
 *
 * Normaliser ici évite d'écrire un rendu par forme — et surtout d'appeler
 * `DOMPurify.sanitize()` sur un tableau, ce qui affichait « [object Object] »
 * au fidèle au lieu du psaume.
 */
function toBlocks(value: unknown): OfficeBlock[] {
  if (typeof value === 'string') {
    const html = value.trim();
    return html ? [{ html }] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => toBlocks(item));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const html = typeof record.text === 'string' ? record.text.trim() : '';
    if (!html) return [];

    const citation = [record.citation, record.title]
      .filter(
        (part): part is string =>
          typeof part === 'string' && part.trim().length > 0,
      )
      .map((part) => part.trim())
      .join(' — ');

    return [citation ? { citation, html } : { html }];
  }

  return [];
}

/**
 * Ordre de récitation d'un office. `hymn` et `hymns` cohabitent parce que le
 * backend a livré les deux orthographes selon les versions.
 */
const SECTIONS: ReadonlyArray<{
  key: string;
  label: string;
  sources: readonly string[];
}> = [
  { key: 'intro', label: 'Introduction', sources: ['intro'] },
  { key: 'hymn', label: 'Hymne', sources: ['hymn', 'hymns'] },
  { key: 'psalms', label: 'Psaumes', sources: ['psalms'] },
  { key: 'canticle', label: 'Cantique', sources: ['canticle'] },
  { key: 'readings', label: 'Parole de Dieu', sources: ['readings'] },
  {
    key: 'intercessions',
    label: 'Intercessions',
    sources: ['intercessions'],
  },
  { key: 'conclusion', label: 'Oraison', sources: ['conclusion'] },
];

/** Sections non vides d'un office, prêtes à être rendues dans l'ordre. */
export function toOfficeSections(
  office: Record<string, unknown> | null | undefined,
): OfficeSection[] {
  if (!office) return [];

  return SECTIONS.map(({ key, label, sources }) => ({
    key,
    label,
    blocks: sources.flatMap((source) => toBlocks(office[source])),
  })).filter((section) => section.blocks.length > 0);
}
