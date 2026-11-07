import { CHURCHES } from '@/config/churches';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ChurchAttendance } from '../services/statsService';

/** One church's numbers for the chosen date. Church 1 is emerald, Church 2 is amber, everywhere. */
export function ChurchStatCard({ data }: { data: ChurchAttendance }) {
  const style = CHURCHES[data.churchGroup];
  const turnoutPercent = Math.min(Math.round((data.turnout ?? 0) * 100), 100);

  return (
    <section aria-label={style.label} className={cn('space-y-4 rounded-xl border p-5', style.soft)}>
      <h2 className={cn('text-sm font-semibold', style.text)}>{style.label}</h2>

      <p className="text-4xl font-bold tabular-nums">
        {data.attended.toLocaleString()}
        <span className="ml-2 text-base font-normal text-muted-foreground">checked in</span>
      </p>

      <dl className="space-y-3 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-muted-foreground">Share of today's attendance</dt>
          <dd className="font-semibold tabular-nums">{formatPercent(data.share)}</dd>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">Turnout</dt>
            <dd className="font-semibold tabular-nums">
              {formatPercent(data.turnout)}
              <span className="ml-1 font-normal text-muted-foreground">
                of {data.roster.toLocaleString()}
              </span>
            </dd>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-background"
            role="img"
            aria-label={`${turnoutPercent}% of ${style.label} came`}
          >
            <div className="h-full rounded-full" style={{ width: `${turnoutPercent}%`, backgroundColor: style.chart }} />
          </div>
        </div>
      </dl>
    </section>
  );
}