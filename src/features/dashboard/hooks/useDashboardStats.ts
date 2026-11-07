import { useQuery } from '@tanstack/react-query';
import { todayInLagos } from '@/lib/dates';
import { getAttendanceSummary } from '../services/statsService';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (serviceDate: string) => ['dashboard', 'summary', serviceDate] as const,
  trend: (limit: number) => ['dashboard', 'trend', limit] as const,
  membership: ['dashboard', 'membership'] as const,
};

/** Attendance for one date. Today's numbers refresh on their own while the page is open. */
export function useDashboardStats(serviceDate: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary(serviceDate),
    queryFn: () => getAttendanceSummary(serviceDate),
    enabled,
    staleTime: 0, // always fresh when you open the dashboard
    refetchInterval: serviceDate === todayInLagos() ? 30_000 : false,
  });
}