import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';

/** Last line of defence: catches crashes and failed lazy-loads so nobody sees a white screen. */
export function ErrorPage() {
  const error = useRouteError();

  const text = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : '';

  // After a new deploy, old browser tabs ask for page files that no longer exist.
  const staleBuild = /dynamically imported module|importing a module script failed|Loading chunk/i.test(text);

  return (
    <ErrorState
      title={staleBuild ? 'A new version is available' : 'Something went wrong'}
      message={
        staleBuild
          ? 'Reload the page to get the latest version.'
          : 'An unexpected error occurred. Reloading usually fixes it.'
      }
      onRetry={() => window.location.reload()}
    />
  );
}