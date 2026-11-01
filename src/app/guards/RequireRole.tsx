import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useSession } from '@/features/auth';
import type { StaffRole } from '@/types';

/** Must be nested inside <RequireAuth>. Only lets the listed roles through. */
export function RequireRole({ allow }: { allow: readonly StaffRole[] }) {
  const auth = useSession();

  if (auth.status !== 'signedIn') return null;
  if (!allow.includes(auth.role)) return <Navigate to={ROUTES.unauthorized} replace />;
  return <Outlet />;
}