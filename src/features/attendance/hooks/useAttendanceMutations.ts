import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { memberKeys } from '@/features/members';
import { attendanceKeys } from './useAttendanceByDate';
import { addAttendance, removeAttendance } from '../services/attendanceAdminService';

export function useAttendanceMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    // a member's own attendance history is shown in the Members drawer
    void queryClient.invalidateQueries({ queryKey: memberKeys.all });
  };

  const add = useMutation({
    mutationFn: addAttendance,
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (attendanceId: string) => removeAttendance(attendanceId),
    onSuccess: () => {
      refresh();
      toast.success('Check-in removed');
    },
  });

  return { add, remove };
}