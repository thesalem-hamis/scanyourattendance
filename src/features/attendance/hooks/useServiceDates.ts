import { useQuery } from '@tanstack/react-query';
import { getServiceDates } from '../services/attendanceAdminService';

/** Dates that have at least one check-in, newest first (for the date pickers). */
export function useServiceDates() {
  return useQuery({
    queryKey: ['attendance', 'dates'] as const,
    queryFn: () => getServiceDates(),
    staleTime: 60_000,
  });
}