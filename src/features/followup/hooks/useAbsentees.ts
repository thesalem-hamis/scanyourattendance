import { useQuery } from '@tanstack/react-query';
import type { ChurchGroup } from '@/types';
import { getAbsentees } from '../services/followupService';

export const followupKeys = {
  /** Every absentee list for one date, whichever church filter it was fetched with. */
  forDate: (serviceDate: string) => ['followup', 'absentees', serviceDate] as const,
  list: (serviceDate: string, church: ChurchGroup | 'all') => ['followup', 'absentees', serviceDate, church] as const,
};

export function useAbsentees(
  serviceDate: string,
  church: ChurchGroup | 'all',
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: followupKeys.list(serviceDate, church),
    queryFn: () => getAbsentees(serviceDate, church),
    enabled,
    staleTime: 10_000,
  });
}
