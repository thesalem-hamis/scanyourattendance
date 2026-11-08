import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import {
  markContacted,
  unmarkContacted,
  type Absentee,
  type ContactChannel,
  type ContactInput,
} from '../services/followupService';
import { followupKeys } from './useAbsentees';

type Snapshot = [readonly unknown[], Absentee[] | undefined][];

/**
 * Mark / un-mark someone as contacted. The row updates the instant you tap (so working down
 * a list feels instant even on a slow connection), and is rolled back with a message if the
 * save fails.
 */
export function useContactMutations() {
  const queryClient = useQueryClient();

  const apply = (serviceDate: string, memberId: string, channel: ContactChannel | null) => {
    queryClient.setQueriesData<Absentee[]>({ queryKey: followupKeys.forDate(serviceDate) }, (rows) =>
      rows?.map((row) =>
        row.memberId === memberId
          ? { ...row, contactedChannel: channel, contactedAt: channel ? new Date().toISOString() : null }
          : row,
      ),
    );
  };

  const begin = async (serviceDate: string, memberId: string, channel: ContactChannel | null) => {
    await queryClient.cancelQueries({ queryKey: followupKeys.forDate(serviceDate) });
    const previous: Snapshot = queryClient.getQueriesData<Absentee[]>({ queryKey: followupKeys.forDate(serviceDate) });
    apply(serviceDate, memberId, channel);
    return { previous };
  };

  const rollback = (context: { previous: Snapshot } | undefined, error: unknown) => {
    context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    toast.error(getErrorMessage(error));
  };

  const refresh = (serviceDate: string) => {
    void queryClient.invalidateQueries({ queryKey: followupKeys.forDate(serviceDate) });
  };

  const mark = useMutation({
    mutationFn: (input: ContactInput) => markContacted(input),
    onMutate: (input) => begin(input.serviceDate, input.memberId, input.channel),
    onError: (error, _input, context) => rollback(context, error),
    onSettled: (_data, _error, input) => refresh(input.serviceDate),
  });

  const unmark = useMutation({
    mutationFn: (input: Omit<ContactInput, 'channel'>) => unmarkContacted(input),
    onMutate: (input) => begin(input.serviceDate, input.memberId, null),
    onError: (error, _input, context) => rollback(context, error),
    onSettled: (_data, _error, input) => refresh(input.serviceDate),
  });

  return { mark, unmark };
}