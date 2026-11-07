import { useQuery } from '@tanstack/react-query';
import { getMembershipStrength } from '../services/statsService';
import { dashboardKeys } from './useDashboardStats';

export function useMembershipStrength() {
  return useQuery({
    queryKey: dashboardKeys.membership,
    queryFn: getMembershipStrength,
    staleTime: 0,
  });
}