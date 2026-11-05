import { useEffect } from 'react';
import { CircleCheck, CircleX, QrCode, TriangleAlert, UserX, type LucideIcon } from 'lucide-react';
import { CHURCHES } from '@/config/churches';
import { cn } from '@/lib/utils';
import type { ScanOutcome } from '../types';

interface ScanResultCardProps {
  outcome: ScanOutcome;
  onDismiss: () => void;
}

interface View {
  icon: LucideIcon;
  title: string;
  /** Full-screen colour. Green = in, amber = already in, red = problem, slate = inactive. */
  className: string;
  /** Goes away by itself after this long (the usher can also tap to continue). */
  autoDismissMs: number;
}

const VIEWS: Record<ScanOutcome['kind'], View> = {
  checked_in: { icon: CircleCheck, title: 'Checked in', className: 'bg-green-600 text-white', autoDismissMs: 2500 },
  already_checked_in: {
    icon: TriangleAlert,
    title: 'Already checked in today',
    className: 'bg-amber-400 text-amber-950',
    autoDismissMs: 3500,
  },
  inactive: { icon: UserX, title: 'Inactive member', className: 'bg-slate-700 text-white', autoDismissMs: 4000 },
  not_found: { icon: CircleX, title: 'Pass not recognised', className: 'bg-red-600 text-white', autoDismissMs: 3500 },
  invalid_qr: { icon: QrCode, title: 'Not a pass QR code', className: 'bg-red-600 text-white', autoDismissMs: 2500 },
  error: { icon: CircleX, title: "Couldn't check in", className: 'bg-red-600 text-white', autoDismissMs: 5000 },
};

/**
 * Full-screen result, readable from arm's length: big colour, big icon, big name.
 * Colour is never the only signal: every state also has its own icon and wording.
 */
export function ScanResultCard({ outcome, onDismiss }: ScanResultCardProps) {
  const view = VIEWS[outcome.kind];
  const Icon = view.icon;

  useEffect(() => {
    const timer = setTimeout(onDismiss, view.autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, view.autoDismissMs]);

  const hasMember = 'member' in outcome;

  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-live="assertive"
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6 text-center',
        view.className,
      )}
    >
      <Icon className="size-24" aria-hidden="true" />
      <p className="text-2xl font-semibold">{view.title}</p>

      {hasMember && (
        <>
          <p className="text-4xl font-bold leading-tight">{outcome.member.fullName}</p>
          <span
            className={cn(
              'rounded-full bg-white px-4 py-1 text-base font-semibold',
              CHURCHES[outcome.member.churchGroup].text,
            )}
          >
            {CHURCHES[outcome.member.churchGroup].label}
          </span>
          <p className="font-mono text-lg opacity-90">{outcome.member.memberCode}</p>
        </>
      )}

      {outcome.kind === 'not_found' && <p className="max-w-xs">Try searching for the teen by name or phone number.</p>}
      {outcome.kind === 'invalid_qr' && <p className="max-w-xs">That QR code isn't from a teen's pass.</p>}
      {outcome.kind === 'inactive' && <p className="max-w-xs">This member is marked inactive. Ask an admin.</p>}
      {outcome.kind === 'error' && <p className="max-w-xs">{outcome.message}</p>}

      <p className="mt-4 text-sm opacity-80">Tap to continue</p>
    </button>
  );
}
