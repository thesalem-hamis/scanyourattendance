import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../services/authService';

export const authKeys = {
  profile: (userId: string) => ['auth', 'profile', userId] as const,
};

/** Loads the staff profile (role) for the given user id. Disabled until there is a user. */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: authKeys.profile(userId ?? 'anonymous'),
    queryFn: () => getProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}
