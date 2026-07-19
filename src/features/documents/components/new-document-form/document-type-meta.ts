import {
  Droplets,
  Flame,
  FileText,
  Gem,
  HandHeart,
  FileQuestion,
  type LucideIcon,
  Wheat,
} from 'lucide-react';

/**
 * Métadonnées de PRÉSENTATION uniquement (icône + repère d'usage), indexées par
 * la valeur du type. La liste des types, leurs libellés et surtout les motifs
 * recevables pour chacun viennent du serveur (`useDocumentOptions`) : la règle
 * « type ↔ motif » est une règle métier ecclésiale, et une copie en dur ici
 * finirait par diverger de celle que le backend applique réellement.
 */
export const DOCUMENT_TYPE_META: Record<
  string,
  { description: string; Icon: LucideIcon }
> = {
  baptism: {
    description:
      'Le plus demandé — requis pour le mariage, le parrainage et la catéchèse.',
    Icon: Droplets,
  },
  first_communion: {
    description: "Atteste la réception de l'Eucharistie.",
    Icon: Wheat,
  },
  confirmation: {
    description: 'Requise pour être parrain ou marraine.',
    Icon: Flame,
  },
  religious_marriage: {
    description: 'Noms des deux époux demandés à l’étape Détails.',
    Icon: Gem,
  },
  godparent: {
    description: 'Précisez la célébration concernée.',
    Icon: HandHeart,
  },
  other: {
    description:
      'Un acte du registre qui ne figure pas dans cette liste — vous préciserez lequel.',
    Icon: FileQuestion,
  },
};

/** Type inconnu du référentiel local : icône neutre, aucune description. */
export const DEFAULT_TYPE_META = {
  description: '',
  Icon: FileText,
} as const;
