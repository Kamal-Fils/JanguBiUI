import type { User } from '../auth';
import {
  canCreateArticle,
  canManageTV,
  canManageUsers,
  canProcessDocuments,
  canPublishArticle,
  canUnpublishArticle,
  isAdmin,
  isDioceseAdminOrAbove,
  isFidele,
  isParishLevelAdmin,
  isProvinceAdminOrAbove,
  isSuperAdmin,
} from '../authorization';

function makeUser(role: User['role']): User {
  return {
    id: '1',
    email: `${role}@test.com`,
    role,
    is_active: true,
    is_verified: true,
    is_admin: role !== 'fidele',
    is_staff: false,
    profile: { first_name: 'Test', last_name: 'User' },
  };
}

const superAdmin = makeUser('super_admin');
const provinceAdmin = makeUser('province_admin');
const dioceseAdmin = makeUser('diocese_admin');
const parishAdmin = makeUser('parish_admin');
const churchAdmin = makeUser('church_admin');
const fidele = makeUser('fidele');

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
