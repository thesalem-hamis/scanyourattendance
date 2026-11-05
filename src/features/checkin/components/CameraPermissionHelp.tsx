import { CameraOff } from 'lucide-react';
import type { IScannerError, ScannerErrorKind } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';

interface CameraPermissionHelpProps {
  error: IScannerError;
  onRetry: () => void;
  onUseSearch: () => void;
}

const COPY: Record<ScannerErrorKind, { title: string; body: string }> = {
  'permission-denied': {
    title: 'Camera access is blocked',
    body: 'Android (Chrome): tap the lock icon next to the address, choose Permissions, then allow Camera. iPhone (Safari): tap "aA" in the address bar, choose Website Settings, then allow Camera. Then try again.',
  },
  'no-camera': { title: 'No camera found', body: "This device doesn't seem to have a camera. Use search instead." },
  'in-use': {
    title: 'The camera is busy',
    body: 'Another app or browser tab is using the camera. Close it, then try again.',
  },
  overconstrained: { title: "This camera can't be used", body: 'Try again, or use search instead.' },
  'insecure-context': {
    title: 'Camera needs a secure page',
    body: 'The camera only works on an https:// page. Check that you opened the official link.',
  },
  unsupported: { title: "This browser can't use the camera", body: 'Try Chrome (Android) or Safari (iPhone), or use search.' },
  aborted: { title: 'The camera stopped', body: 'Try again.' },
  security: { title: 'The browser blocked the camera', body: 'Check the site permissions, then try again.' },
  'type-error': { title: "The camera couldn't start", body: 'Try again, or use search.' },
  unknown: { title: "The camera couldn't start", body: 'Try again, or use search.' },
};

export function CameraPermissionHelp({ error, onRetry, onUseSearch }: CameraPermissionHelpProps) {
  const copy = COPY[error.kind];

  return (
    <div className="space-y-4 rounded-xl border bg-background p-5 text-center">
      <CameraOff className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <h2 className="font-semibold">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
      </div>
      <div className="flex justify-center gap-2">
        <Button onClick={onRetry}>Try again</Button>
        <Button variant="outline" onClick={onUseSearch}>
          Search instead
        </Button>
      </div>
    </div>
  );
}