import { CHURCHES } from '@/config/churches';
import { cn } from '@/lib/utils';
import type { MembershipRow, MembershipStrengthData } from '../services/statsService';

function Block({ row, tone }: { row: MembershipRow; tone: 'church1' | 'church2' | 'combined' }) {
  const style = row.churchGroup === 'Combined' ? null : CHURCHES[row.churchGroup];
  return (
    <section
      aria-label={`${row.churchGroup} membership`}
      className={cn('space-y-3 rounded-xl border p-5', style ? style.soft : 'bg-background', tone === 'combined' && 'border-foreground/20')}
    >
      <h3 className={cn('text-sm font-semibold', style?.text)}>{row.churchGroup === 'Combined' ? 'Both churches' : row.churchGroup}</h3>
      <p className="text-4xl font-bold tabular-nums">
        {row.active.toLocaleString()}
        <span className="ml-2 text-base font-normal text-muted-foreground">active members</span>
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Boys</dt>
        <dd className="text-right font-medium tabular-nums">{row.male.toLocaleString()}</dd>
        <dt className="text-muted-foreground">Girls</dt>
        <dd className="text-right font-medium tabular-nums">{row.female.toLocaleString()}</dd>
        <dt className="text-muted-foreground">Joined in the last 7 days</dt>
        <dd className="text-right font-medium tabular-nums">{row.newLast7Days.toLocaleString()}</dd>
        <dt className="text-muted-foreground">Joined in the last 30 days</dt>
        <dd className="text-right font-medium tabular-nums">{row.newLast30Days.toLocaleString()}</dd>
        <dt className="text-muted-foreground">Inactive</dt>
        <dd className="text-right font-medium tabular-nums">{row.inactive.toLocaleString()}</dd>
      </dl>
    </section>
  );
}

/** How big each church is: everyone on the list, not just who came this Sunday. */
export function MembershipStrength({ data }: { data: MembershipStrengthData }) {
  const [church1, church2] = data.churches;
  return (
    <section aria-label="Membership" className="space-y-3">
      <h2 className="text-lg font-semibold">Membership</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <Block row={church1} tone="church1" />
        <Block row={church2} tone="church2" />
        <Block row={data.combined} tone="combined" />
      </div>
    </section>
  );
}
