import { Navigate } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { FullPageSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/config/routes';
import { getHomeForRole, useSession } from '@/features/auth';

/** The "/" route: sends everyone to the right place. */
export function HomeRedirect() {
  const auth = useSession();

  switch (auth.status) {
    case 'loading':
      return <FullPageSpinner />;
    case 'error':
      return <ErrorState title="Can't load your account" onRetry={auth.retry} />;
    case 'signedOut':
      return <Navigate to={ROUTES.login} replace />;
    case 'noAccess':
      return <Navigate to={ROUTES.unauthorized} replace />;
    case 'signedIn':
      return <Navigate to={getHomeForRole(auth.role)} replace />;
  }
}