import {
  CalendarHeart,
  Cross,
  HeartHandshake,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Source unique des libellés (et icônes) des types d'intention de messe.
 * Réutilisée par le formulaire (options du Select) et par la carte éditoriale
 * (surtitre / CardEyebrow), afin d'éviter toute dérive entre les deux.
 */
export type IntentionType =
  | 'for_deceased'
  | 'for_living'
  | 'for_occasion'
  | 'for_community';

interface IntentionTypeMeta {
  label: string;
  icon: LucideIcon;
}

export const INTENTION_TYPE_META: Record<string, IntentionTypeMeta> = {
  for_deceased: { label: 'Pour un défunt', icon: Cross },
  for_living: { label: 'Pour un vivant', icon: HeartHandshake },
  for_occasion: { label: 'Pour une occasion', icon: CalendarHeart },
  for_community: { label: 'Pour la communauté', icon: Users },
};

export const getIntentionTypeLabel = (type: string): string =>
  INTENTION_TYPE_META[type]?.label ?? 'Intention de messe';
