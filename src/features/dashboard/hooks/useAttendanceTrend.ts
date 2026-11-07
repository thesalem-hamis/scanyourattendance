import { useQuery } from '@tanstack/react-query';
import { getAttendanceTrend } from '../services/statsService';
import { dashboardKeys } from './useDashboardStats';

export function useAttendanceTrend(limit = 12) {
  return useQuery({
    queryKey: dashboardKeys.trend(limit),
    queryFn: () => getAttendanceTrend(limit),
    staleTime: 0,
  });
}
