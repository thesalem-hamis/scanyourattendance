import { QrCode, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatServiceDate, formatTime } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import { useMemberHistory } from '../hooks/useMemberHistory';

export function MemberAttendanceHistory({ memberId }: { memberId: string }) {
  const { data, isPending, isError, error } = useMemberHistory(memberId);

  return (
    <section aria-label="Attendance history" className="space-y-2">
      <h3 className="text-sm font-semibold">
        Attendance {data && <span className="font-normal text-muted-foreground">({data.total} in total)</span>}
      </h3>

      {isPending && (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      )}
      {isError && <p className="text-sm text-destructive">{getErrorMessage(error)}</p>}
      {data && data.rows.length === 0 && <p className="text-sm text-muted-foreground">Hasn't checked in yet.</p>}

      {data && data.rows.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border">
            {data.rows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  {formatServiceDate(row.serviceDate)}
                  <span className="ml-2 text-xs text-muted-foreground">{formatTime(row.checkInTime)}</span>
                </span>
                {row.method === 'qr_scan' ? (
                  <QrCode className="size-4 text-muted-foreground" aria-label="Scanned" />
                ) : (
                  <Search className="size-4 text-muted-foreground" aria-label="Searched" />
                )}
              </li>
            ))}
          </ul>
          {data.total > data.rows.length && (
            <p className="text-xs text-muted-foreground">Showing the latest {data.rows.length}.</p>
          )}
        </>
      )}
    </section>
  );
}