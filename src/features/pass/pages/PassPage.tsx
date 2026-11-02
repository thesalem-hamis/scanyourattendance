import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useSession } from '@/features/auth';
import { getErrorMessage } from '@/lib/error';
import { DigitalPass } from '../components/DigitalPass';
import { PassNotFound } from '../components/PassNotFound';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { SavePassActions } from '../components/SavePassActions';
import { SendPassButtons } from '../components/SendPassButtons';
import { usePass } from '../hooks/usePass';
import { rememberPass } from '../utils/rememberedPass';

export default function PassPage() {
  const { token = '' } = useParams();
  const auth = useSession();
  const { data: pass, isPending, isError, error, refetch } = usePass(token);
  const cardRef = useRef<HTMLDivElement>(null);

  // Remember the pass on a teen's own phone, but not when staff are just viewing someone's pass.
  useEffect(() => {
    if (pass && auth.status !== 'loading' && auth.status !== 'signedIn') rememberPass(pass.qrToken);
  }, [pass, auth.status]);

  if (isPending) {
    return (
      <div className="grid place-items-center py-20">
        <LoadingSpinner className="size-8" />
      </div>
    );
  }
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
  if (!pass) return <PassNotFound />;

  return (
    <div className="flex flex-col items-center gap-5">
      <DigitalPass ref={cardRef} pass={pass} />
      <div className="w-full max-w-xs space-y-3">
        <SavePassActions getNode={() => cardRef.current} name={pass.fullName} />
        <SendPassButtons pass={pass} />
        <PWAInstallPrompt />
      </div>
    </div>
  );
}