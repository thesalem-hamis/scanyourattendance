import { extractPassToken } from '@/lib/qr';

export { extractPassToken as parseQrPayload } from '@/lib/qr';

/** First valid pass token among everything the camera saw in one frame, or null. */
export function tokenFromDetected(codes: ReadonlyArray<{ rawValue: string }>): string | null {
  for (const code of codes) {
    const token = extractPassToken(code.rawValue);
    if (token) return token;
  }
  return null;
}
