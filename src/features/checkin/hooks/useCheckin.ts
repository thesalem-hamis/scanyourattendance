import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceKeys } from '@/features/attendance';
import { checkIn, type CheckInInput } from '../services/checkinService';

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckInInput) => checkIn(input),
    // Refresh the feed in the background. Deliberately NOT returned: returning the promise
    // would keep the check-in "pending" until the feed reloaded, delaying the result screen.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}