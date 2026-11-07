import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMembers } from '@/features/members';
import { useDebounce } from '@/hooks/useDebounce';
import { formatServiceDate } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import { buildSearchFilter } from '@/lib/memberSearch';
import { formatPhoneDisplay } from '@/lib/phone';
import { useAttendanceMutations } from '../hooks/useAttendanceMutations';

interface ManualCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceDate: string;
  /** Members already checked in on this date. */
  alreadyIn: ReadonlySet<string>;
}

/** Record that someone was there but never got checked in (for example, from a paper list). */
export function ManualCorrectionDialog({ open, onOpenChange, serviceDate, alreadyIn }: ManualCorrectionDialogProps) {
  const [text, setText] = useState('');
  const search = useDebounce(text, 300);
  const canSearch = buildSearchFilter(search) !== null;
  const members = useMembers({ search, church: 'all', status: 'active', page: 0, pageSize: 8 });
  const { add } = useAttendanceMutations();

  const addMember = (memberId: string, name: string) =>
    add.mutate(
      { memberId, serviceDate },
      {
        onSuccess: () => toast.success(`${name} added for ${formatServiceDate(serviceDate)}`),
        // the error also shows inside the dialog, below
      },
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setText('');
          add.reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a check-in</DialogTitle>
          <DialogDescription>Record that someone was there on {formatServiceDate(serviceDate)}.</DialogDescription>
        </DialogHeader>

        <SearchInput value={text} onChange={setText} placeholder="Name or phone number" label="Find a member to add" />

        {add.isError && <p className="text-sm text-destructive">{getErrorMessage(add.error)}</p>}

        {!canSearch && <p className="text-sm text-muted-foreground">Type at least 2 letters of a name, or 3 digits of a phone number.</p>}

        {canSearch && members.isPending && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}
        {canSearch && members.data && members.data.rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No active member found.</p>
        )}

        {canSearch && members.data && members.data.rows.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {members.data.rows.map((member) => {
              const isIn = alreadyIn.has(member.id);
              const pending = add.isPending && add.variables?.memberId === member.id;
              return (
                <li key={member.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.fullName}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <ChurchBadge church={member.churchGroup} />
                      <span>{formatPhoneDisplay(member.phone)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant={isIn ? 'secondary' : 'default'} disabled={isIn || add.isPending} onClick={() => addMember(member.id, member.fullName)}>
                    {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {isIn ? 'Already in' : 'Add'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}