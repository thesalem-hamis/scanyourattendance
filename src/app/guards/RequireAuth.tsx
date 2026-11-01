import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { FullPageSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/config/routes';
import { useSession } from '@/features/auth';

/** Lets signed-in staff through. Everyone else is redirected. */
export function RequireAuth() {
  const auth = useSession();
  const location = useLocation();

  switch (auth.status) {
    case 'loading':
      // Never redirect while we're still finding out who this is,
      // otherwise every refresh would bounce logged-in users to /login.
      return <FullPageSpinner />;
    case 'error':
      return <ErrorState title="Can't load your account" onRetry={auth.retry} />;
    case 'signedOut': {
      const from = `${location.pathname}${location.search}${location.hash}`;
      return <Navigate to={ROUTES.login} replace state={{ from }} />;
    }
    case 'noAccess':
      return <Navigate to={ROUTES.unauthorized} replace />;
    case 'signedIn':
      return <Outlet />;
  }
}