import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { useSession } from '@/features/auth';
import { UserMenu } from './components/UserMenu';

/** Mobile-first shell for the check-in screen. Used by ushers and by the admin. */
export function UsherLayout() {
  const auth = useSession();
  const isAdmin = auth.status === 'signedIn' && auth.role === 'admin';

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
        <div className="leading-tight">
          <div className="font-semibold">{APP_NAME}</div>
          <div className="text-xs text-muted-foreground">Check-in</div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              render={<Link to={ROUTES.admin.dashboard} />}
            >
              <LayoutDashboard className="mr-2 size-4" />
              Dashboard
            </Button>
          )}

          <UserMenu />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  );
}
//you removed the asChild