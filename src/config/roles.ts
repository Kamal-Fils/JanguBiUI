import type { StatusTone } from '@/components/ui/status-badge';
import type { PastoralRole, UserRole } from '@/lib/auth';

/**
 * Clé d'affichage = les deux dimensions réunies. `RoleBadge` libelle aussi bien
 * un rôle admin (`role`) qu'une identité pastorale (`pastoral_role`), donc la map
 * couvre l'union UserRole | PastoralRole (et non le seul UserRole, désormais
 * restreint aux 6 valeurs admin).
 */
type RoleKey = UserRole | PastoralRole;

/** Libellés FR canoniques des rôles (source unique — remplace 3 maps dupliquées). */
export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: 'Super Admin',
  province_admin: 'Province',
  diocese_admin: 'Diocèse',
  parish_admin: 'Paroisse',
  church_admin: 'Église',
  fidele: 'Fidèle',
  pretre: 'Prêtre',
  diacre: 'Diacre',
  eveque: 'Évêque',
  archeveque: 'Archevêque',
  religieux: 'Religieux',
};

/** Couleur sémantique (tokenisée) associée à chaque rôle. */
export const ROLE_TONES: Record<RoleKey, StatusTone> = {
  super_admin: 'danger',
  province_admin: 'accent',
  diocese_admin: 'warning',
  parish_admin: 'info',
  church_admin: 'info',
  pretre: 'progress',
  diacre: 'progress',
  eveque: 'progress',
  archeveque: 'progress',
  religieux: 'progress',
  fidele: 'neutral',
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return '—';
  return ROLE_LABELS[role as UserRole] ?? role;
}

export function roleTone(role: string | null | undefined): StatusTone {
  return ROLE_TONES[role as UserRole] ?? 'neutral';
}
