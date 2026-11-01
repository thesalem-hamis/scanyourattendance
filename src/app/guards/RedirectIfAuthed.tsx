import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { FullPageSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/config/routes';
import { getPostLoginPath, useSession } from '@/features/auth';

/** Wraps /login: signed-in users are sent on to where they were headed (or their home). */
export function RedirectIfAuthed() {
  const auth = useSession();
  const location = useLocation();

  switch (auth.status) {
    case 'loading':
      return <FullPageSpinner />;
    case 'error':
      return <ErrorState title="Can't load your account" onRetry={auth.retry} />;
    case 'noAccess':
      return <Navigate to={ROUTES.unauthorized} replace />;
    case 'signedIn': {
      const from = (location.state as { from?: string } | null)?.from;
      return <Navigate to={getPostLoginPath(auth.role, from)} replace />;
    }
    case 'signedOut':
      return <Outlet />;
  }
}