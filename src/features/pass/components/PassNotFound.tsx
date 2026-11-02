import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';

export function PassNotFound() {
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="text-xl font-semibold">We couldn't find that pass</h1>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">
        The link may be incomplete, or this pass is no longer active. Ask an usher to send it again, or register
        if you're new.
      </p>
      <Link to={ROUTES.register} className={buttonVariants()}>
        Register
      </Link>
    </div>
  );
}
