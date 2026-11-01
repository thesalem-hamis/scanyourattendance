import { Link, Outlet } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { AdminSidebar } from './components/AdminSidebar';
import { MobileBottomNav} from './components/MobileBottomNav';
import { UserMenu } from './components/UserMenu';

export function AdminLayout() {
  return (
    <div className="min-h-dvh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r bg-background md:block">
        <AdminSidebar />
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
          <span className="font-semibold md:hidden">{APP_NAME}</span>
          <span className="hidden md:block" />
          <div className="flex items-center gap-2">
            {/* Admin can scan too: same screen the ushers use */}
            <Button size="sm">
              <Link to={ROUTES.usher}>
                <ScanLine className="mr-2 size-4" />
                Scan
              </Link>
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
