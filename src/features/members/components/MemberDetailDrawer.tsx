import { Pencil, UserCheck, UserX } from 'lucide-react';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SendPassButtons } from '@/features/pass';
import { formatServiceDate, toLagosDate } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import { formatPhoneDisplay } from '@/lib/phone';
import { useMember } from '../hooks/useMembers';
import type { MemberDetail } from '../services/memberService';
import { MemberAttendanceHistory } from './MemberAttendanceHistory';

interface MemberDetailDrawerProps {
  memberId: string | null;
  onClose: () => void;
  onEdit: (member: MemberDetail) => void;
  onToggleStatus: (member: MemberDetail) => void;
}

export function MemberDetailDrawer({ memberId, onClose, onEdit, onToggleStatus }: MemberDetailDrawerProps) {
  const { data: member, isPending, isError, error, refetch } = useMember(memberId);

  return (
    <Sheet open={memberId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{member?.fullName ?? 'Member'}</SheetTitle>
          <SheetDescription>{member ? member.memberCode : 'Loading details…'}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {isPending && (
            <div className="flex justify-center py-10">
              <LoadingSpinner className="size-8" />
            </div>
          )}
          {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />}

          {member && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <ChurchBadge church={member.churchGroup} />
                <StatusPill active={member.isActive} />
              </div>

              <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>
                  <a href={`tel:${member.phone}`} className="underline-offset-2 hover:underline">
                    {formatPhoneDisplay(member.phone)}
                  </a>
                </dd>
                <dt className="text-muted-foreground">Age</dt>
                <dd>{member.age ?? '–'}</dd>
                <dt className="text-muted-foreground">Gender</dt>
                <dd>{member.gender}</dd>
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{formatServiceDate(toLagosDate(member.createdAt))}</dd>
                <dt className="text-muted-foreground">Consent</dt>
                <dd>{member.consentAt ? `Recorded ${formatServiceDate(toLagosDate(member.consentAt))}` : 'Not recorded'}</dd>
              </dl>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => onEdit(member)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => onToggleStatus(member)}>
                  {member.isActive ? (
                    <>
                      <UserX className="mr-2 size-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 size-4" />
                      Reactivate
                    </>
                  )}
                </Button>
              </div>

              {member.isActive && (
                <section className="space-y-2" aria-label="Send pass">
                  <h3 className="text-sm font-semibold">Send their pass</h3>
                  <SendPassButtons
                    pass={{ fullName: member.fullName, churchGroup: member.churchGroup, qrToken: member.qrToken }}
                    phone={member.phone}
                  />
                </section>
              )}

              <MemberAttendanceHistory memberId={member.id} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
