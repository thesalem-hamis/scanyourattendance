import { useQuery } from '@tanstack/react-query';
import { getMemberHistory } from '../services/memberService';
import { memberKeys } from './useMembers';

export function useMemberHistory(memberId: string | null) {
  return useQuery({
    queryKey: memberKeys.history(memberId ?? 'none'),
    queryFn: () => getMemberHistory(memberId as string),
    enabled: memberId !== null,
  });
}