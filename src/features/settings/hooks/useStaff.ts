import { useQuery } from '@tanstack/react-query';
import { getStaff } from '../services/settingsService';
import { settingsKeys } from './useMessageTemplates';

export function useStaff() {
  return useQuery({ queryKey: settingsKeys.staff, queryFn: getStaff, staleTime: 5 * 60_000 });
}
