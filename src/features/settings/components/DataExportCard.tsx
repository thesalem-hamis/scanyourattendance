import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayInLagos } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import { downloadCsv } from '@/lib/exportCsv';
import {
  attendanceCsv,
  fetchAttendanceForExport,
  fetchMembersForExport,
  membersCsv,
} from '../services/exportService';

type Busy = 'members' | 'attendance' | null;

export function DataExportCard() {
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const today = todayInLagos();

  const run = async (kind: Exclude<Busy, null>, job: () => Promise<{ file: string; csv: string; count: number }>) => {
    setBusy(kind);
    setError(null);
    try {
      const { file, csv, count } = await job();
      downloadCsv(file, csv);
      toast.success(`Downloaded ${count.toLocaleString()} ${count === 1 ? 'row' : 'rows'}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border bg-background p-4">
      <p className="text-sm text-muted-foreground">
        These files contain teenagers' names and phone numbers. Keep them private, and delete them when you are done.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Members</h3>
        <p className="text-xs text-muted-foreground">Everyone on the list, active and inactive.</p>
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() =>
            run('members', async () => {
              const rows = await fetchMembersForExport();
              return { file: `members-${today}.csv`, csv: membersCsv(rows), count: rows.length };
            })
          }
        >
          {busy === 'members' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
          Download members
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Attendance</h3>
        <p className="text-xs text-muted-foreground">Every check-in. Leave the dates empty for everything.</p>
        <div className="grid max-w-md gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="export-from">From</Label>
            <Input id="export-from" type="date" max={today} value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="export-to">To</Label>
            <Input id="export-to" type="date" max={today} value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() =>
            run('attendance', async () => {
              const rows = await fetchAttendanceForExport({ from: from || undefined, to: to || undefined });
              return { file: `attendance-${from || 'start'}-to-${to || today}.csv`, csv: attendanceCsv(rows), count: rows.length };
            })
          }
        >
          {busy === 'attendance' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
          Download attendance
        </Button>
      </div>
    </div>
  );
}
