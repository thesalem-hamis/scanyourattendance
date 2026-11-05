import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { buildSearchFilter, searchMembers } from '../services/checkinService';

export function useMemberSearch(query: string) {
  return useQuery({
    queryKey: ['members', 'search', query.trim().toLowerCase()],
    queryFn: () => searchMembers(query),
    enabled: buildSearchFilter(query) !== null,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}