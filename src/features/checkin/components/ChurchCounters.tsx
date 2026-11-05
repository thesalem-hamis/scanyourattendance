import { useMemo } from 'react';
import { CHURCHES, CHURCH_GROUPS } from '@/config/churches';
import type { AttendanceRow } from '@/features/attendance';
import { cn } from '@/lib/utils';

/** Running totals for today: Church 1, Church 2 and everyone together. */
export function ChurchCounters({ rows }: { rows: AttendanceRow[] | undefined }) {
  const counts = useMemo(() => {
    const result = { 'Church 1': 0, 'Church 2': 0 };
    for (const row of rows ?? []) result[row.churchGroup] += 1;
    return result;
  }, [rows]);

  const total = counts['Church 1'] + counts['Church 2'];

  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      {CHURCH_GROUPS.map((group) => (
        <div key={group} className={cn('rounded-lg border p-3', CHURCHES[group].soft)}>
          <dt className={cn('text-xs font-medium', CHURCHES[group].text)}>{CHURCHES[group].label}</dt>
          <dd className="text-2xl font-bold tabular-nums">{rows ? counts[group] : '–'}</dd>
        </div>
      ))}
      <div className="rounded-lg border bg-background p-3">
        <dt className="text-xs font-medium text-muted-foreground">Total</dt>
        <dd className="text-2xl font-bold tabular-nums">{rows ? total : '–'}</dd>
      </div>
    </dl>
  );
}