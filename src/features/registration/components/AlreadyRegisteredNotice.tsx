import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';

/**
 * Shown when the phone number is already registered. We never reveal the existing
 * pass for a phone number (anyone could type someone else's number), so the teen
 * either opens the pass saved on this phone or asks an usher to resend it.
 */
export function AlreadyRegisteredNotice({ rememberedToken }: { rememberedToken: string | null }) {
  return (
    <Alert>
      <AlertTitle>You're already registered</AlertTitle>
      <AlertDescription>
        <p>This phone number is already in our list.</p>
        {rememberedToken ? (
          <Link to={ROUTES.pass(rememberedToken)} className={buttonVariants({ className: 'mt-3' })}>
            Open my pass
          </Link>
        ) : (
          <p className="mt-1">Ask an usher to send your pass again.</p>
        )}
      </AlertDescription>
    </Alert>
  );
}