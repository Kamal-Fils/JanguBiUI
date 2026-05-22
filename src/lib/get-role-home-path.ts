import { paths } from '@/config/paths';

import { User } from './auth';
import { isAdmin, isClergy } from './authorization';

export function getRoleHomePath(user: User | null | undefined): string {
  if (isAdmin(user)) return paths.app.admin.root.getHref();
  if (isClergy(user)) return paths.app.clerge.root.getHref();
  return paths.app.root.getHref();
}
