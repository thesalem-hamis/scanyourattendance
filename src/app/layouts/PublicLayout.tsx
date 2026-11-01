import { Outlet } from 'react-router-dom';
import { APP_NAME } from '@/config/constants';

/** Shell for pages teens use without logging in (/register, /pass/:token). */
export function PublicLayout() {
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <span className="font-semibold">{APP_NAME}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  );
}