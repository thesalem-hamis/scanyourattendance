import { useCallback, useEffect, useRef, useState } from 'react';
import type { IDetectedBarcode, IScannerError } from '@yudiel/react-qr-scanner';
import { tokenFromDetected } from '../utils/parseQrPayload';

interface Options {
  /** True while a result is on screen or a check-in is in flight: scans are ignored. */
  paused: boolean;
  onToken: (token: string) => void;
  onInvalid: () => void;
  /** The same pass is ignored for this long after it was read. */
  cooldownMs?: number;
}

/**
 * The brains around the camera component: turns raw detections into "one check-in per
 * scan". It ignores scans while paused, ignores the same pass twice in a row
 * (a teen still holding the phone up), and rate-limits "not a pass" warnings.
 */
export function useQRScanner({ paused, onToken, onInvalid, cooldownMs = 5000 }: Options) {
  const [cameraError, setCameraError] = useState<IScannerError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const recent = useRef(new Map<string, number>());
  const lastInvalidAt = useRef(0);

  // Always call the latest callbacks without changing handleScan's identity
  const callbacks = useRef({ onToken, onInvalid, paused });
  useEffect(() => {
    callbacks.current = { onToken, onInvalid, paused };
  });

  const handleScan = useCallback(
    (codes: IDetectedBarcode[]) => {
      const current = callbacks.current;
      if (current.paused || codes.length === 0) return;

      const now = Date.now();
      const token = tokenFromDetected(codes);

      if (!token) {
        if (now - lastInvalidAt.current > 3000) {
          lastInvalidAt.current = now;
          current.onInvalid();
        }
        return;
      }

      const lastSeen = recent.current.get(token);
      if (lastSeen !== undefined && now - lastSeen < cooldownMs) return;
      recent.current.set(token, now);
      current.onToken(token);
    },
    [cooldownMs],
  );

  const handleError = useCallback((error: IScannerError) => setCameraError(error), []);

  /** Clears the error and remounts the camera (use as the scanner's `key`). */
  const retry = useCallback(() => {
    setCameraError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { handleScan, handleError, cameraError, retry, attempt };
}