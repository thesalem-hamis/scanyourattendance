import { ClipboardList, QrCode, Search, Trash2 } from 'lucide-react';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTime } from '@/lib/dates';
import type { AttendanceRow } from '../services/attendanceService';

interface AttendanceTableProps {
  rows: AttendanceRow[];
  onRemove: (row: AttendanceRow) => void;
  /** Whether a filter or search is hiding some of the day's rows. */
  filtered: boolean;
}

function Method({ method }: { method: AttendanceRow['method'] }) {
  return method === 'qr_scan' ? (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <QrCode className="size-4" aria-hidden="true" /> Scanned
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Search className="size-4" aria-hidden="true" /> Added by hand
    </span>
  );
}

export function AttendanceTable({ rows, onRemove, filtered }: AttendanceTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={filtered ? 'No one matches' : 'No check-ins on this date'}
        description={filtered ? 'Try a different church or name.' : 'Use "Add a check-in" if someone was there but was not checked in.'}
      />
    );
  }

  return (
    <>
      <div className="hidden rounded-lg border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>How</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Remove</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.fullName}</div>
                  <div className="font-mono text-xs text-muted-foreground">{row.memberCode}</div>
                </TableCell>
                <TableCell>
                  <ChurchBadge church={row.churchGroup} />
                </TableCell>
                <TableCell className="tabular-nums">{formatTime(row.checkInTime)}</TableCell>
                <TableCell>
                  <Method method={row.method} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${row.fullName}'s check-in`} onClick={() => onRemove(row)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y rounded-lg border bg-background md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{row.fullName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <ChurchBadge church={row.churchGroup} />
                <span>{formatTime(row.checkInTime)}</span>
                <Method method={row.method} />
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label={`Remove ${row.fullName}'s check-in`} onClick={() => onRemove(row)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}