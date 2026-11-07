import { formatPercent } from '@/lib/format';
import type { AttendanceSummary } from '../services/statsService';

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-3xl font-bold tabular-nums">{value}</dd>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Both churches together for the chosen date. */
export function OverallSummary({ summary }: { summary: AttendanceSummary }) {
  const { total } = summary;
  return (
    <section aria-label="Both churches combined" className="rounded-xl border bg-background p-5">
      <h2 className="mb-4 text-sm font-semibold">Both churches together</h2>
      <dl className="grid grid-cols-3 gap-4">
        <Stat label="Checked in" value={total.attended.toLocaleString()} />
        <Stat label="On the list" value={total.roster.toLocaleString()} note="active members" />
        <Stat label="Turnout" value={formatPercent(total.turnout)} note="checked in ÷ on the list" />
      </dl>
    </section>
  );
}