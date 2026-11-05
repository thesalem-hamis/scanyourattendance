import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createMember, setMemberStatus, updateMember } from '../services/memberService';
import type { MemberFormValues } from '../schemas/memberSchema';
import { memberKeys } from './useMembers';

export function useMemberMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: memberKeys.all });
  };

  const create = useMutation({
    mutationFn: (values: MemberFormValues) => createMember(values),
    onSuccess: () => {
      refresh();
      toast.success('Member added');
    },
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MemberFormValues }) => updateMember(id, values),
    onSuccess: () => {
      refresh();
      toast.success('Member updated');
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => setMemberStatus(id, status),
    onSuccess: (_data, { status }) => {
      refresh();
      toast.success(status === 'active' ? 'Member reactivated' : 'Member deactivated');
    },
  });

  return { create, update, setStatus };
}
