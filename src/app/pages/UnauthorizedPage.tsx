// import { Link, Navigate } from 'react-router-dom';
// import { ErrorState } from '@/components/common/ErrorState';
// import { FullPageSpinner } from '@/components/common/LoadingSpinner';
// import { Button } from '@/components/ui/button';
// import { ROUTES } from '@/config/routes';
// import { getHomeForRole, useLogout, useSession } from '@/features/auth';

// export function UnauthorizedPage() {
//   const auth = useSession();
//   const logout = useLogout();

//   if (auth.status === 'loading') return <FullPageSpinner />;
//   if (auth.status === 'error') return <ErrorState onRetry={auth.retry} />;
//   if (auth.status === 'signedOut') return <Navigate to={ROUTES.login} replace />;

//   const noRole = auth.status === 'noAccess';

//   return (
//     <div className="grid min-h-dvh place-items-center p-6 text-center">
//       <div className="max-w-sm space-y-4">
//         <h1 className="text-xl font-semibold">{noRole ? 'Your account is not set up yet' : 'No access to that page'}</h1>
//         <p className="text-sm text-muted-foreground">
//           {noRole
//             ? 'You are signed in, but no role has been assigned to this login. Ask the admin to finish setting it up.'
//             : "Your account doesn't have permission to open that page."}
//         </p>
//         <div className="flex justify-center gap-2">
//           {auth.status === 'signedIn' && (
//             <Button asChild>
//               <Link to={getHomeForRole(auth.role)}>Go to my home</Link>
//             </Button>
//           )}
//           <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
//             Sign out
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }


import { Link, Navigate } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { FullPageSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { getHomeForRole, useLogout, useSession } from '@/features/auth';

export function UnauthorizedPage() {
  const auth = useSession();
  const logout = useLogout();

  if (auth.status === 'loading') return <FullPageSpinner />;
  if (auth.status === 'error') return <ErrorState onRetry={auth.retry} />;
  if (auth.status === 'signedOut') return <Navigate to={ROUTES.login} replace />;

  const noRole = auth.status === 'noAccess';

  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">
          {noRole ? 'Your account is not set up yet' : 'No access to that page'}
        </h1>

        <p className="text-sm text-muted-foreground">
          {noRole
            ? 'You are signed in, but no role has been assigned to this login. Ask the admin to finish setting it up.'
            : "Your account doesn't have permission to open that page."}
        </p>

        <div className="flex justify-center gap-2">
          {auth.status === 'signedIn' && (
            <Button render={<Link to={getHomeForRole(auth.role)} />}>
              Go to my home
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
