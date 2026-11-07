import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { CHURCH_GROUPS } from '@/config/churches';
import { formatServiceDate, todayInLagos } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import type { ChurchGroup } from '@/types';
import { AttendanceFilters } from '../components/AttendanceFilters';
import { AttendanceTable } from '../components/AttendanceTable';
import { ManualCorrectionDialog } from '../components/ManualCorrectionDialog';
import { useAttendanceByDate } from '../hooks/useAttendanceByDate';
import { useAttendanceMutations } from '../hooks/useAttendanceMutations';
import { useServiceDates } from '../hooks/useServiceDates';
import type { AttendanceRow } from '../services/attendanceService';

export default function AttendancePage() {
  const today = todayInLagos();
  const dates = useServiceDates();
  const [picked, setPicked] = useState<string | null>(null);
  const [church, setChurch] = useState<ChurchGroup | 'all'>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<AttendanceRow | null>(null);

  // Open on the most recent date with check-ins unless another one was chosen
  const datesSettled = dates.data !== undefined || dates.isError;
  const serviceDate = picked ?? dates.data?.[0] ?? today;

  const attendance = useAttendanceByDate(serviceDate);
  const { remove } = useAttendanceMutations();

  const all = attendance.data;
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (all ?? []).filter(
      (row) =>
        (church === 'all' || row.churchGroup === church) &&
        (term === '' || row.fullName.toLowerCase().includes(term) || row.memberCode.toLowerCase().includes(term)),
    );
  }, [all, church, search]);
  const alreadyIn = useMemo(() => new Set((all ?? []).map((row) => row.memberId)), [all]);

  const counts = CHURCH_GROUPS.map((group) => `${(all ?? []).filter((row) => row.churchGroup === group).length} ${group}`);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        description={
          all ? `${formatServiceDate(serviceDate)}: ${all.length} checked in (${counts.join(', ')})` : formatServiceDate(serviceDate)
        }
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="mr-2 size-4" />
            Add a check-in
          </Button>
        }
      />

      <AttendanceFilters
        dates={dates.data ?? []}
        today={today}
        serviceDate={serviceDate}
        onServiceDateChange={setPicked}
        church={church}
        onChurchChange={setChurch}
        search={search}
        onSearchChange={setSearch}
      />

      {(attendance.isPending || (picked === null && !datesSettled)) && (
        <div className="flex justify-center py-16">
          <LoadingSpinner className="size-8" />
        </div>
      )}
      {attendance.isError && !attendance.data && (
        <ErrorState message={getErrorMessage(attendance.error)} onRetry={() => void attendance.refetch()} />
      )}
      {all && (picked !== null || datesSettled) && (
        <AttendanceTable rows={visible} onRemove={setRemoving} filtered={church !== 'all' || search.trim() !== ''} />
      )}

      <ManualCorrectionDialog open={adding} onOpenChange={setAdding} serviceDate={serviceDate} alreadyIn={alreadyIn} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
            remove.reset();
          }
        }}
        title={`Remove ${removing?.fullName ?? ''}'s check-in?`}
        description={`They will no longer count as present on ${formatServiceDate(serviceDate)}. You can add them back at any time.`}
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        errorMessage={remove.isError ? getErrorMessage(remove.error) : null}
        onConfirm={() => {
          if (removing) remove.mutate(removing.id, { onSuccess: () => setRemoving(null) });
        }}
      />
    </div>
  );
}