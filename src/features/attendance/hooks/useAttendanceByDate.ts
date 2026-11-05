import { useQuery } from '@tanstack/react-query';
import { getAttendanceByDate } from '../services/attendanceService';

export const attendanceKeys = {
  all: ['attendance'] as const,
  byDate: (serviceDate: string) => ['attendance', 'date', serviceDate] as const,
};

interface Options {
  /** Poll as a safety net (e.g. while a live feed is on screen). */
  refetchIntervalMs?: number;
}

export function useAttendanceByDate(serviceDate: string, { refetchIntervalMs }: Options = {}) {
  return useQuery({
    queryKey: attendanceKeys.byDate(serviceDate),
    queryFn: () => getAttendanceByDate(serviceDate),
    refetchInterval: refetchIntervalMs,
  });
}