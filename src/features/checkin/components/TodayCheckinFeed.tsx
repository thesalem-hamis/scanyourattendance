import { QrCode, Search } from 'lucide-react';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import type { AttendanceRow } from '@/features/attendance';
import { formatTime } from '@/lib/dates';

interface TodayCheckInFeedProps {
  rows: AttendanceRow[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

const VISIBLE = 25;

/** Live list of who has checked in today, newest first. */
export function TodayCheckInFeed({ rows, isPending, isError, onRetry }: TodayCheckInFeedProps) {
  return (
    <section className="space-y-2" aria-label="Today's check-ins">
      <h2 className="text-sm font-semibold">Checked in today</h2>

      {isPending && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {isError && !rows && (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span className="text-destructive">Couldn't load today's check-ins.</span>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}

      {rows && rows.length === 0 && <p className="text-sm text-muted-foreground">No one has checked in yet.</p>}

      {rows && rows.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border bg-background px-3">
            {rows.slice(0, VISIBLE).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.fullName}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <ChurchBadge church={row.churchGroup} />
                    <span>{formatTime(row.checkInTime)}</span>
                  </div>
                </div>
                {row.method === 'qr_scan' ? (
                  <QrCode className="size-4 shrink-0 text-muted-foreground" aria-label="Scanned" />
                ) : (
                  <Search className="size-4 shrink-0 text-muted-foreground" aria-label="Searched" />
                )}
              </li>
            ))}
          </ul>
          {rows.length > VISIBLE && (
            <p className="text-center text-xs text-muted-foreground">+ {rows.length - VISIBLE} earlier today</p>
          )}
        </>
      )}
    </section>
  );
}