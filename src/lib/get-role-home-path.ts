import { paths } from '@/config/paths';

import { User } from './auth';
import { isAdmin, isClergy } from './authorization';

export function getRoleHomePath(user: User | null | undefined): string {
  // Le clergé (identité dans `pastoral_role`) atterrit sur son dashboard pastoral
  // rendu par HomeRouter à /app (Eveque/Pretre Dashboard) — y compris le clergé
  // qui cumule un rôle admin (curé = parish_admin, évêque = diocese_admin) : son
  // espace admin reste accessible via la passerelle de la nav clergé.
  // Ordre clé : isClergy AVANT isAdmin, sinon un évêque/curé (admin) serait renvoyé
  // sur /app/admin et ne verrait jamais son dashboard. (Décision « home pastoral
  // + admin accessible ».)
  if (isClergy(user)) return paths.app.root.getHref();
  if (isAdmin(user)) return paths.app.admin.root.getHref();
  return paths.app.root.getHref();
}
