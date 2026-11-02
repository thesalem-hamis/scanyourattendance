import { useQuery } from '@tanstack/react-query';
import { getPass } from '../services/passService';

export const passKeys = {
  byToken: (token: string) => ['pass', token] as const,
};

export function usePass(token: string) {
  return useQuery({
    queryKey: passKeys.byToken(token),
    queryFn: () => getPass(token),
    staleTime: 10 * 60_000,
  });
}
