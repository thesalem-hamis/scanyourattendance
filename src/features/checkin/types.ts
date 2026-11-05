import type { CheckInResult, MemberCard } from './services/checkinService';

/** Everything the big result screen can show. */
export type ScanOutcome =
  | { kind: 'checked_in' | 'already_checked_in' | 'inactive'; member: MemberCard }
  | { kind: 'not_found' }
  | { kind: 'invalid_qr' }
  | { kind: 'error'; message: string };

export type FeedbackTone = 'success' | 'warning' | 'error';

export function outcomeFromResult(result: CheckInResult): ScanOutcome {
  return result.result === 'not_found' ? { kind: 'not_found' } : { kind: result.result, member: result.member };
}

export function toneFor(outcome: ScanOutcome): FeedbackTone {
  if (outcome.kind === 'checked_in') return 'success';
  if (outcome.kind === 'already_checked_in') return 'warning';
  return 'error';
}
