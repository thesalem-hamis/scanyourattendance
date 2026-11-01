import { QueryClient } from '@tanstack/react-query';
import { toAppError } from './error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // Retry only transient failures (network / unknown), never permission or auth errors.
      retry: (failureCount, error) => failureCount < 2 && toAppError(error).retryable,
    },
    mutations: {
      // Mutations are never retried automatically: a retried check-in must be a deliberate action.
      retry: false,
    },
  },
});