import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getMember, listMembers, type MemberFilters } from '../services/memberService';

export const memberKeys = {
  /** Also covers the usher search cache (['members', 'search', ...]) so edits show up there too. */
  all: ['members'] as const,
  list: (filters: MemberFilters) => ['members', 'list', filters] as const,
  detail: (id: string) => ['members', 'detail', id] as const,
  history: (id: string) => ['members', 'history', id] as const,
};

export function useMembers(filters: MemberFilters) {
  return useQuery({
    queryKey: memberKeys.list(filters),
    queryFn: () => listMembers(filters),
    // Keep showing the old page while the next one loads, so the table doesn't flash empty
    placeholderData: keepPreviousData,
  });
}

export function useMember(id: string | null) {
  return useQuery({
    queryKey: memberKeys.detail(id ?? 'none'),
    queryFn: () => getMember(id as string),
    enabled: id !== null,
  });
}
