import { ROUTES } from '@/config/routes';
import type { StaffRole } from '@/types';

export function getHomeForRole(role: StaffRole): string {
  return role === 'admin' ? ROUTES.admin.dashboard : ROUTES.usher;
}

/**
 * Where to go after login: the page the user was originally trying to open
 * (if their role may see it), otherwise their role's home.
 */
export function getPostLoginPath(role: StaffRole, from?: string): string {
  const blocked: string[] = [ROUTES.login, ROUTES.home, ROUTES.unauthorized];
  if (from && from.startsWith('/') && !blocked.includes(from)) {
    const isAdminArea = from.startsWith(ROUTES.admin.root);
    if (!isAdminArea || role === 'admin') return from;
  }
  return getHomeForRole(role);
}