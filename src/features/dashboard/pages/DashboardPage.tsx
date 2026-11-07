import { useState } from 'react';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useServiceDates } from '@/features/attendance';
import { formatServiceDate, todayInLagos } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import { AttendanceTrendChart } from '../components/AttendanceTrendChart';
import { ChurchStatCard } from '../components/ChurchStatCard';
import { DateSelector } from '../components/DateSelector';
import { MembershipStrength } from '../components/MembershipStrength';
import { OverallSummary } from '../components/OverallSummary';
import { useAttendanceTrend } from '../hooks/useAttendanceTrend';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useMembershipStrength } from '../hooks/useMembershipStrength';

function Section({ pending, error, onRetry, children }: { pending: boolean; error: unknown; onRetry: () => void; children: React.ReactNode }) {
  if (pending) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner className="size-8" />
      </div>
    );
  }
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />;
  return <>{children}</>;
}

export default function DashboardPage() {
  const today = todayInLagos();
  const dates = useServiceDates();
  const [picked, setPicked] = useState<string | null>(null);

  // Show the most recent date with check-ins, unless the admin chose another one.
  // Wait for the list of dates first so the numbers don't flash "today" and then jump.
  const datesSettled = dates.data !== undefined || dates.isError;
  const serviceDate = picked ?? dates.data?.[0] ?? today;

  const summary = useDashboardStats(serviceDate, { enabled: picked !== null || datesSettled });
  const trend = useAttendanceTrend(12);
  const membership = useMembershipStrength();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={formatServiceDate(serviceDate)}
        actions={
          <div className="w-64 max-w-full">
            <DateSelector value={serviceDate} onChange={setPicked} />
          </div>
        }
      />

      <Section
        pending={summary.isPending || (picked === null && !datesSettled)}
        error={summary.error}
        onRetry={() => void summary.refetch()}
      >
        {summary.data && (
          <div className="space-y-4">
            <OverallSummary summary={summary.data} />
            <div className="grid gap-4 md:grid-cols-2">
              {summary.data.churches.map((church) => (
                <ChurchStatCard key={church.churchGroup} data={church} />
              ))}
            </div>
          </div>
        )}
      </Section>

      <section aria-label="Attendance over time" className="space-y-3">
        <h2 className="text-lg font-semibold">Sunday by Sunday</h2>
        <Section pending={trend.isPending} error={trend.error} onRetry={() => void trend.refetch()}>
          {trend.data && <AttendanceTrendChart data={trend.data} />}
        </Section>
      </section>

      <Section pending={membership.isPending} error={membership.error} onRetry={() => void membership.refetch()}>
        {membership.data && <MembershipStrength data={membership.data} />}
      </Section>
    </div>
  );
}
