import { ADMIN_ROLES, CLERGY_ROLES, User, UserRole } from './auth';

export const isAdmin = (user: User | null | undefined): boolean => {
  return user ? ADMIN_ROLES.includes(user.role) : false;
};

export const isSuperAdmin = (user: User | null | undefined): boolean => {
  return user?.role === 'super_admin';
};

export const isProvinceAdminOrAbove = (
  user: User | null | undefined,
): boolean => {
  return user
    ? (['super_admin', 'province_admin'] as UserRole[]).includes(user.role)
    : false;
};

export const isDioceseAdminOrAbove = (
  user: User | null | undefined,
): boolean => {
  return user
    ? (
        ['super_admin', 'province_admin', 'diocese_admin'] as UserRole[]
      ).includes(user.role)
    : false;
};

export const isParishLevelAdmin = (user: User | null | undefined): boolean => {
  return user
    ? (['parish_admin', 'church_admin'] as UserRole[]).includes(user.role)
    : false;
};

export const isFidele = (user: User | null | undefined): boolean => {
  return user?.role === 'fidele';
};

// Articles
export const canCreateArticle = (user: User | null | undefined): boolean =>
  isAdmin(user);

export const canPublishArticle = (user: User | null | undefined): boolean =>
  isAdmin(user);

// church_admin cannot unpublish — only parish_admin and above
export const canUnpublishArticle = (user: User | null | undefined): boolean => {
  return user
    ? (
        [
          'super_admin',
          'province_admin',
          'diocese_admin',
          'parish_admin',
        ] as UserRole[]
      ).includes(user.role)
    : false;
};

// Document requests
export const canProcessDocuments = (user: User | null | undefined): boolean =>
  isAdmin(user);

// User management (diocese level and above)
export const canManageUsers = (user: User | null | undefined): boolean =>
  isDioceseAdminOrAbove(user);

// TV content (super admin only)
export const canManageTV = (user: User | null | undefined): boolean =>
  isSuperAdmin(user);

// Clergy checks
export const isClergy = (user: User | null | undefined): boolean =>
  user ? CLERGY_ROLES.includes(user.role) : false;

export const isPretre = (user: User | null | undefined): boolean =>
  user?.role === 'pretre';

export const isDiacre = (user: User | null | undefined): boolean =>
  user?.role === 'diacre';

export const isEvequeOrAbove = (user: User | null | undefined): boolean =>
  user ? (['eveque', 'archeveque'] as UserRole[]).includes(user.role) : false;

export const isPastoralRole = (user: User | null | undefined): boolean =>
  isClergy(user) || isFidele(user);

// Can invite clergy members (eveque, archeveque via pastoral_role, or super_admin)
export const canManageClergy = (user: User | null | undefined): boolean =>
  isSuperAdmin(user) || isEvequeOrAbove(user);
