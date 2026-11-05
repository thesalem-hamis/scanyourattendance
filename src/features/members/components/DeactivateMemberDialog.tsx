import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getErrorMessage } from '@/lib/error';
import { useMemberMutations } from '../hooks/useMemberMutations';
import type { MemberDetail } from '../services/memberService';

interface DeactivateMemberDialogProps {
  /** The member to deactivate (or reactivate, if they're already inactive). Null = closed. */
  member: MemberDetail | null;
  onClose: () => void;
}

export function DeactivateMemberDialog({ member, onClose }: DeactivateMemberDialogProps) {
  const { setStatus } = useMemberMutations();
  const reactivating = member ? !member.isActive : false;

  return (
    <ConfirmDialog
      open={member !== null}
      onOpenChange={(open) => !open && onClose()}
      title={reactivating ? `Reactivate ${member?.fullName ?? ''}?` : `Deactivate ${member?.fullName ?? ''}?`}
      description={
        reactivating
          ? 'They will be able to check in again and will appear in follow-up lists.'
          : "They won't be able to check in and won't appear in follow-up lists. Their attendance history is kept, and you can reactivate them any time."
      }
      confirmLabel={reactivating ? 'Reactivate' : 'Deactivate'}
      destructive={!reactivating}
      pending={setStatus.isPending}
      errorMessage={setStatus.isError ? getErrorMessage(setStatus.error) : null}
      onConfirm={() => {
        if (!member) return;
        setStatus.mutate({ id: member.id, status: reactivating ? 'active' : 'inactive' }, { onSuccess: onClose });
      }}
    />
  );
}