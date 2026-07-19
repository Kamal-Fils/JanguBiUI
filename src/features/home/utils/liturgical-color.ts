/**
 * Couleur liturgique du jour, déduite du temps liturgique renvoyé par l'AELF.
 *
 * L'Église habille ses célébrations d'une couleur : violet pour l'attente et
 * la pénitence, blanc et or pour la joie, rouge pour l'Esprit et les martyrs,
 * vert pour le temps ordinaire. L'application la porte donc elle aussi — ce
 * n'est pas un ornement mais une information que tout fidèle sait lire, et
 * elle change au fil de l'année sans qu'on ait rien à publier.
 *
 * L'API n'expose pas ce champ (`LiturgicalDate` n'a que `season`/`day_name`) :
 * on le dérive du libellé, ce qui est déterministe et sans coût réseau.
 */

export type LiturgicalColor = 'violet' | 'white' | 'red' | 'green';

export interface LiturgicalTone {
  color: LiturgicalColor;
  /** Nom du temps, tel qu'on l'affiche en surtitre. */
  label: string;
  /** Teinte d'accent — variables CSS, jamais de couleur brute. */
  accentVar: string;
  /** Surface teintée très douce pour le fond du héros. */
  washClass: string;
  /** Texte d'accent lisible sur fond clair ET sombre. */
  inkClass: string;
}

const TONES: Record<LiturgicalColor, Omit<LiturgicalTone, 'label'>> = {
  // Avent, Carême — attente et pénitence.
  violet: {
    color: 'violet',
    accentVar: '265 45% 45%',
    washClass: 'from-[hsl(265_45%_45%_/_0.10)] to-transparent',
    inkClass: 'text-[hsl(265_50%_38%)] dark:text-[hsl(265_60%_78%)]',
  },
  // Noël, Pâques, fêtes du Seigneur et de la Vierge — joie.
  white: {
    color: 'white',
    accentVar: '40 65% 48%',
    washClass: 'from-[hsl(40_65%_48%_/_0.12)] to-transparent',
    inkClass: 'text-gold-ink',
  },
  // Pentecôte, martyrs, Rameaux — le feu et le sang.
  red: {
    color: 'red',
    accentVar: '0 60% 45%',
    washClass: 'from-[hsl(0_60%_45%_/_0.10)] to-transparent',
    inkClass: 'text-[hsl(0_62%_40%)] dark:text-[hsl(0_70%_74%)]',
  },
  // Temps ordinaire — l'espérance qui dure.
  green: {
    color: 'green',
    accentVar: '150 40% 34%',
    washClass: 'from-[hsl(150_40%_34%_/_0.10)] to-transparent',
    inkClass: 'text-[hsl(150_45%_28%)] dark:text-[hsl(150_45%_70%)]',
  },
};

/** Ordre important : les temps les plus spécifiques sont testés en premier. */
const SEASON_RULES: ReadonlyArray<[RegExp, LiturgicalColor]> = [
  [/pentec[oô]te|rameaux|martyr|passion|vendredi\s+saint/i, 'red'],
  [/av[eé]nt|car[eê]me|cendres/i, 'violet'],
  [/no[eë]l|p[aâ]ques|pascal|[eé]piphanie|ascension|assomption|toussaint|nativit[eé]/i, 'white'],
  [/ordinaire/i, 'green'],
];

export function getLiturgicalTone(season?: string | null): LiturgicalTone {
  const raw = (season ?? '').trim();
  const match = SEASON_RULES.find(([pattern]) => pattern.test(raw));
  // Sans information de temps, le vert du temps ordinaire est le repli le plus
  // fréquent de l'année — jamais une couleur de fête choisie par défaut.
  const color = match ? match[1] : 'green';
  return { ...TONES[color], label: raw || 'Temps ordinaire' };
}
