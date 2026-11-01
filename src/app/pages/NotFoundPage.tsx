import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-sm space-y-3">
        <p className="text-5xl font-bold text-muted-foreground">404</p>

        <h1 className="text-xl font-semibold">Page not found</h1>

        <p className="text-sm text-muted-foreground">
          That link doesn't lead anywhere.
        </p>

        <Button render={<Link to={ROUTES.home} />}>
          Go home
        </Button>
      </div>
    </div>
  );
}
