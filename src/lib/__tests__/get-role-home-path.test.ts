import { describe, expect, it } from 'vitest';

import type { PastoralRole, User, UserRole } from '../auth';
import { getRoleHomePath } from '../get-role-home-path';

// Construit un User au CONTRAT RÉEL /me : `role` = dimension admin (jamais une
// valeur pastorale), `pastoral_role` = identité clergé (null pour un laïc).
function makeUser(
  role: UserRole,
  pastoralRole: PastoralRole | null = null,
): User {
  return {
    id: '1',
    email: `${role}-${pastoralRole ?? 'lay'}@test.com`,
    role,
    pastoral_role: pastoralRole,
    onboarding_state: 'completed',
    is_active: true,
    is_verified: true,
    is_admin: role !== 'fidele',
    is_staff: false,
    profile: { first_name: 'Test', last_name: 'User' },
  };
}

describe('getRoleHomePath', () => {
  // Le clergé — y compris celui qui cumule un rôle admin — atterrit sur son
  // dashboard pastoral (/app, rendu par HomeRouter). C'est le cœur du fix :
  // sans l'ordre isClergy-avant-isAdmin, un évêque/curé partait sur /app/admin.
  it.each<[string, User]>([
    ['évêque (diocese_admin + eveque)', makeUser('diocese_admin', 'eveque')],
    [
      'archevêque (province_admin + archeveque)',
      makeUser('province_admin', 'archeveque'),
    ],
    ['curé (parish_admin + pretre)', makeUser('parish_admin', 'pretre')],
    ['diacre (church_admin + diacre)', makeUser('church_admin', 'diacre')],
    ['vicaire (fidele + pretre)', makeUser('fidele', 'pretre')],
    ['religieux (fidele + religieux)', makeUser('fidele', 'religieux')],
  ])('route %s vers /app (dashboard pastoral)', (_label, user) => {
    expect(getRoleHomePath(user)).toBe('/app');
  });

  // Les administrateurs PURS (sans identité pastorale) vont à l'espace admin.
  it.each<[string, User]>([
    ['super_admin', makeUser('super_admin', null)],
    [
      'parish_admin laïc (gestionnaire digital)',
      makeUser('parish_admin', null),
    ],
    ['diocese_admin laïc', makeUser('diocese_admin', null)],
  ])('route %s vers /app/admin', (_label, user) => {
    expect(getRoleHomePath(user)).toBe('/app/admin');
  });

  it('route un fidèle laïc vers /app', () => {
    expect(getRoleHomePath(makeUser('fidele', 'fidele'))).toBe('/app');
  });

  it('route un utilisateur inconnu/null vers /app', () => {
    expect(getRoleHomePath(null)).toBe('/app');
    expect(getRoleHomePath(undefined)).toBe('/app');
  });
});
