import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/routes';
import { getRememberedPass } from '@/features/pass';
import { RegistrationForm } from '../components/RegistrationForm';

export default function RegisterPage() {
  const [rememberedToken] = useState(() => getRememberedPass());

  return (
    <div className="space-y-4">
      {rememberedToken && (
        <Card>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm">You already have a pass on this phone.</p>
            <Link to={ROUTES.pass(rememberedToken)} className={buttonVariants({ size: 'sm' })}>
              Open it
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Join the teens</CardTitle>
          <CardDescription>Takes under a minute. You'll get a QR pass to scan at the door.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}