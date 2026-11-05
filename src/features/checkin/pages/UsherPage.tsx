import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, QrCode, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/error';
import { cn } from '@/lib/utils';
import { CameraPermissionHelp } from '../components/CameraPermissionHelp';
import { ChurchCounters } from '../components/ChurchCounters';
import { ManualSearch } from '../components/ManualSearch';
import { QRCameraScanner } from '../components/QRCameraScanner';
import { ScanResultCard } from '../components/ScanResultCard';
import { TodayCheckInFeed } from '../components/TodayCheckinFeed';
import { useCheckIn } from '../hooks/useCheckin';
import { useQRScanner } from '../hooks/useQRScanner';
import { useTodayFeed } from '../hooks/useTodayFeed';
import type { CheckInInput } from '../services/checkinService';
import { outcomeFromResult, toneFor, type ScanOutcome } from '../types';
import { preloadDecoder } from '../utils/decoder';
import { playFeedback, primeAudio } from '../utils/feedback';

type Mode = 'scan' | 'search';

export default function UsherPage() {
  const [mode, setMode] = useState<Mode>('scan');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  const feed = useTodayFeed();
  const { mutate, isPending, variables } = useCheckIn();

  // Start downloading the QR decoder now, so the first scan is instant.
  useEffect(() => {
    preloadDecoder();
  }, []);

  const checkedInIds = useMemo(() => new Set((feed.data ?? []).map((row) => row.memberId)), [feed.data]);

  const show = useCallback((next: ScanOutcome) => {
    setOutcome(next);
    playFeedback(toneFor(next));
  }, []);

  const dismiss = useCallback(() => setOutcome(null), []);

  const runCheckIn = useCallback(
    (input: CheckInInput) => {
      mutate(input, {
        onSuccess: (result) => show(outcomeFromResult(result)),
        onError: (error) => show({ kind: 'error', message: getErrorMessage(error) }),
      });
    },
    [mutate, show],
  );

  const scanner = useQRScanner({
    // Ignore the camera while a result is showing or a check-in is being sent
    paused: outcome !== null || isPending,
    onToken: (token) => runCheckIn({ kind: 'token', token }),
    onInvalid: () => show({ kind: 'invalid_qr' }),
  });

  const pendingMemberId = isPending && variables?.kind === 'member' ? variables.memberId : null;

  return (
    <div className="space-y-4">
      <ChurchCounters rows={feed.data} />

      <div role="tablist" aria-label="Check-in method" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <ModeTab active={mode === 'scan'} onClick={() => setMode('scan')} icon={<QrCode className="size-4" />}>
          Scan QR
        </ModeTab>
        <ModeTab active={mode === 'search'} onClick={() => setMode('search')} icon={<Search className="size-4" />}>
          Search
        </ModeTab>
      </div>

      {mode === 'scan' &&
        (scanner.cameraError ? (
          <CameraPermissionHelp
            error={scanner.cameraError}
            onRetry={scanner.retry}
            onUseSearch={() => setMode('search')}
          />
        ) : cameraStarted ? (
          <QRCameraScanner
            key={scanner.attempt}
            paused={outcome !== null || isPending}
            onScan={scanner.handleScan}
            onError={scanner.handleError}
          />
        ) : (
          <div className="space-y-3 rounded-xl border bg-background p-6 text-center">
            <Camera className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Point the camera at a teen's QR code. It checks them in automatically.
            </p>
            <Button
              size="lg"
              onClick={() => {
                primeAudio(); // lets iPhones play the check-in sounds later
                setCameraStarted(true);
              }}
            >
              Start camera
            </Button>
          </div>
        ))}

      {mode === 'search' && (
        <ManualSearch
          checkedInIds={checkedInIds}
          pendingMemberId={pendingMemberId}
          onCheckIn={(memberId) => {
            primeAudio();
            runCheckIn({ kind: 'member', memberId });
          }}
        />
      )}

      <TodayCheckInFeed
        rows={feed.data}
        isPending={feed.isPending}
        isError={feed.isError}
        onRetry={() => void feed.refetch()}
      />

      {outcome && <ScanResultCard outcome={outcome} onDismiss={dismiss} />}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors',
        active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

