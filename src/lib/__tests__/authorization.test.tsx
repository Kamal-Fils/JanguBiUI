import type { PastoralRole, User, UserRole } from '../auth';
import {
  canCreateArticle,
  canManageClergy,
  canManageTV,
  canManageUsers,
  canProcessDocuments,
  canPublishArticle,
  canUnpublishArticle,
  isAdmin,
  isClergy,
  isDiacre,
  isDioceseAdminOrAbove,
  isEvequeOrAbove,
  isFidele,
  isParishLevelAdmin,
  isPastoralRole,
  isPretre,
  isProvinceAdminOrAbove,
  isSuperAdmin,
} from '../authorization';

function makeUser(role: UserRole): User {
  return {
    id: '1',
    email: `${role}@test.com`,
    role,
    pastoral_role: null,
    onboarding_state: 'completed',
    is_active: true,
    is_verified: true,
    is_admin: role !== 'fidele',
    is_staff: false,
    profile: { first_name: 'Test', last_name: 'User' },
  };
}

// Contrat réel de /me : un membre du clergé a role='fidele' (dimension admin)
// et son identité pastorale dans `pastoral_role`. `role` ne vaut JAMAIS une
// valeur pastorale côté backend. C'est ce contrat que les helpers doivent lire.
function makeClergy(
  pastoral_role: PastoralRole,
  role: UserRole = 'fidele',
): User {
  return { ...makeUser(role), pastoral_role };
}

const superAdmin = makeUser('super_admin');
const provinceAdmin = makeUser('province_admin');
const dioceseAdmin = makeUser('diocese_admin');
const parishAdmin = makeUser('parish_admin');
const churchAdmin = makeUser('church_admin');
const fidele = makeUser('fidele');

// Clergé selon le vrai contrat (pastoral_role porteur, role='fidele').
const religieux = makeClergy('religieux');
const diacre = makeClergy('diacre');
const pretre = makeClergy('pretre');
const eveque = makeClergy('eveque');
const archeveque = makeClergy('archeveque');

describe('isAdmin', () => {
  test('returns true for all admin roles', () => {
    expect(isAdmin(superAdmin)).toBe(true);
    expect(isAdmin(provinceAdmin)).toBe(true);
    expect(isAdmin(dioceseAdmin)).toBe(true);
    expect(isAdmin(parishAdmin)).toBe(true);
    expect(isAdmin(churchAdmin)).toBe(true);
  });

  test('returns false for fidele and null/undefined', () => {
    expect(isAdmin(fidele)).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  test('returns true only for super_admin', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(isSuperAdmin(provinceAdmin)).toBe(false);
    expect(isSuperAdmin(fidele)).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe('isProvinceAdminOrAbove', () => {
  test('returns true for super_admin and province_admin', () => {
    expect(isProvinceAdminOrAbove(superAdmin)).toBe(true);
    expect(isProvinceAdminOrAbove(provinceAdmin)).toBe(true);
    expect(isProvinceAdminOrAbove(dioceseAdmin)).toBe(false);
    expect(isProvinceAdminOrAbove(fidele)).toBe(false);
  });
});

describe('isDioceseAdminOrAbove', () => {
  test('returns true for super, province, and diocese admins', () => {
    expect(isDioceseAdminOrAbove(superAdmin)).toBe(true);
    expect(isDioceseAdminOrAbove(provinceAdmin)).toBe(true);
    expect(isDioceseAdminOrAbove(dioceseAdmin)).toBe(true);
    expect(isDioceseAdminOrAbove(parishAdmin)).toBe(false);
    expect(isDioceseAdminOrAbove(fidele)).toBe(false);
  });
});

describe('isParishLevelAdmin', () => {
  test('returns true for parish_admin and church_admin only', () => {
    expect(isParishLevelAdmin(parishAdmin)).toBe(true);
    expect(isParishLevelAdmin(churchAdmin)).toBe(true);
    expect(isParishLevelAdmin(superAdmin)).toBe(false);
    expect(isParishLevelAdmin(fidele)).toBe(false);
  });
});

describe('isFidele', () => {
  test('returns true only for fidele role', () => {
    expect(isFidele(fidele)).toBe(true);
    expect(isFidele(superAdmin)).toBe(false);
    expect(isFidele(null)).toBe(false);
  });
});

describe('Article permissions', () => {
  test('canCreateArticle: any admin can create', () => {
    expect(canCreateArticle(superAdmin)).toBe(true);
    expect(canCreateArticle(parishAdmin)).toBe(true);
    expect(canCreateArticle(fidele)).toBe(false);
    expect(canCreateArticle(null)).toBe(false);
  });

  test('canPublishArticle: any admin can publish', () => {
    expect(canPublishArticle(superAdmin)).toBe(true);
    expect(canPublishArticle(churchAdmin)).toBe(true);
    expect(canPublishArticle(fidele)).toBe(false);
  });

  test('canUnpublishArticle: church_admin cannot unpublish', () => {
    expect(canUnpublishArticle(superAdmin)).toBe(true);
    expect(canUnpublishArticle(parishAdmin)).toBe(true);
    expect(canUnpublishArticle(churchAdmin)).toBe(false);
    expect(canUnpublishArticle(fidele)).toBe(false);
    expect(canUnpublishArticle(null)).toBe(false);
  });
});

describe('Document permissions', () => {
  test('canProcessDocuments: any admin', () => {
    expect(canProcessDocuments(superAdmin)).toBe(true);
    expect(canProcessDocuments(churchAdmin)).toBe(true);
    expect(canProcessDocuments(fidele)).toBe(false);
  });
});

describe('User management permissions', () => {
  test('canManageUsers: diocese level and above', () => {
    expect(canManageUsers(superAdmin)).toBe(true);
    expect(canManageUsers(provinceAdmin)).toBe(true);
    expect(canManageUsers(dioceseAdmin)).toBe(true);
    expect(canManageUsers(parishAdmin)).toBe(false);
    expect(canManageUsers(fidele)).toBe(false);
  });
});

describe('TV management permissions', () => {
  test('canManageTV: super admin only', () => {
    expect(canManageTV(superAdmin)).toBe(true);
    expect(canManageTV(provinceAdmin)).toBe(false);
    expect(canManageTV(fidele)).toBe(false);
    expect(canManageTV(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Dimension pastorale — l'identité clergé vit dans `pastoral_role`, jamais dans
// `role`. Ces tests encodent le contrat réel de /me ; ils échouent tant que les
// helpers lisent `user.role` (F2 les recâble sur `user.pastoral_role`).
// ---------------------------------------------------------------------------

describe('isClergy (pastoral_role)', () => {
  test('true for the four clergy tiers + religieux, read from pastoral_role', () => {
    expect(isClergy(religieux)).toBe(true);
    expect(isClergy(diacre)).toBe(true);
    expect(isClergy(pretre)).toBe(true);
    expect(isClergy(eveque)).toBe(true);
    expect(isClergy(archeveque)).toBe(true);
  });

  test('false for a plain fidele and for digital admins without pastoral_role', () => {
    expect(isClergy(fidele)).toBe(false);
    expect(isClergy(superAdmin)).toBe(false);
    expect(isClergy(parishAdmin)).toBe(false);
    expect(isClergy(null)).toBe(false);
  });

  test('a curé who is also parish_admin is still clergy via pastoral_role', () => {
    expect(isClergy(makeClergy('pretre', 'parish_admin'))).toBe(true);
  });
});

describe('isPretre / isDiacre (pastoral_role)', () => {
  test('isPretre true only for pastoral_role=pretre', () => {
    expect(isPretre(pretre)).toBe(true);
    expect(isPretre(diacre)).toBe(false);
    expect(isPretre(eveque)).toBe(false);
    expect(isPretre(fidele)).toBe(false);
    expect(isPretre(null)).toBe(false);
  });

  test('isDiacre true only for pastoral_role=diacre', () => {
    expect(isDiacre(diacre)).toBe(true);
    expect(isDiacre(pretre)).toBe(false);
    expect(isDiacre(fidele)).toBe(false);
  });
});

describe('isEvequeOrAbove (pastoral_role)', () => {
  test('true for eveque and archeveque only', () => {
    expect(isEvequeOrAbove(eveque)).toBe(true);
    expect(isEvequeOrAbove(archeveque)).toBe(true);
    expect(isEvequeOrAbove(pretre)).toBe(false);
    expect(isEvequeOrAbove(diacre)).toBe(false);
    expect(isEvequeOrAbove(fidele)).toBe(false);
    expect(isEvequeOrAbove(superAdmin)).toBe(false);
  });
});

describe('isPastoralRole', () => {
  test('true for clergy (via pastoral_role) and for lay fidele (via role)', () => {
    expect(isPastoralRole(pretre)).toBe(true);
    expect(isPastoralRole(eveque)).toBe(true);
    expect(isPastoralRole(religieux)).toBe(true);
    expect(isPastoralRole(fidele)).toBe(true);
  });

  test('false for a pure digital admin (no pastoral identity)', () => {
    expect(isPastoralRole(superAdmin)).toBe(false);
    expect(isPastoralRole(provinceAdmin)).toBe(false);
    expect(isPastoralRole(null)).toBe(false);
  });
});

describe('canManageClergy', () => {
  test('true for super_admin (role) and for eveque/archeveque (pastoral_role)', () => {
    expect(canManageClergy(superAdmin)).toBe(true);
    expect(canManageClergy(eveque)).toBe(true);
    expect(canManageClergy(archeveque)).toBe(true);
  });

  test('false for priests, deacons, lay faithful and lower admins', () => {
    expect(canManageClergy(pretre)).toBe(false);
    expect(canManageClergy(diacre)).toBe(false);
    expect(canManageClergy(fidele)).toBe(false);
    expect(canManageClergy(dioceseAdmin)).toBe(false);
    expect(canManageClergy(null)).toBe(false);
  });
});
