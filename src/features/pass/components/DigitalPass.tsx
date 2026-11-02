import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_NAME } from '@/config/constants';
import { CHURCHES } from '@/config/churches';
import { buildPassUrl } from '@/lib/qr';
import { cn } from '@/lib/utils';
import type { Pass } from '../services/passService';

interface DigitalPassProps {
  pass: Pass;
  className?: string;
}

/**
 * The pass card. Colours are fixed (not theme-based) so the QR code stays
 * black-on-white and scannable, and the saved image looks the same in dark mode.
 */
export const DigitalPass = forwardRef<HTMLDivElement, DigitalPassProps>(function DigitalPass(
  { pass, className },
  ref,
) {
  const church = CHURCHES[pass.churchGroup];

  return (
    <div
      ref={ref}
      className={cn('w-full max-w-xs overflow-hidden rounded-2xl border bg-white text-neutral-900 shadow-sm', className)}
    >
      <div className={cn('px-5 py-4', church.solid)}>
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">{APP_NAME}</p>
        <p className="text-lg font-semibold">{church.label}</p>
      </div>

      <div className="space-y-5 px-5 py-6 text-center">
        <div>
          <h2 className="text-xl font-bold leading-tight">{pass.fullName}</h2>
          <p className="mt-1 font-mono text-sm text-neutral-500">{pass.memberCode}</p>
        </div>

        <div className="mx-auto w-fit rounded-xl bg-white p-3 ring-1 ring-neutral-200">
          <QRCodeSVG
            value={buildPassUrl(pass.qrToken)}
            size={208}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            title="Your check-in QR code"
          />
        </div>

        <p className="text-xs text-neutral-500">Show this QR code at the door every Sunday</p>
      </div>
    </div>
  );
});