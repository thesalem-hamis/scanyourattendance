import { useMemo, useState } from 'react';
import { TriangleAlert, Users } from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { NativeSelect } from '@/components/common/NativeSelect';
import { PageHeader } from '@/components/common/PageHeader';
import { ServiceDateSelect } from '@/components/common/ServiceDateSelect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAttendanceByDate, useServiceDates } from '@/features/attendance';
import { useMessageTemplates } from '@/features/settings';
import { CHURCH_GROUPS } from '@/config/churches';
import { formatServiceDate, todayInLagos } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import type { ChurchGroup } from '@/types';
import { AbsenteeList } from '../components/AbsenteeList';
import { BulkSendPanel } from '../components/BulkSendPanel';
import { MessageComposer } from '../components/MessageComposer';
import { useAbsentees } from '../hooks/useAbsentees';
import { useContactMutations } from '../hooks/useMarkContacted';
import type { Absentee, ContactChannel } from '../services/followupService';
import { buildFollowUpMessage } from '../utils/buildFollowUpMessage';

export default function FollowUpPage() {
  const today = todayInLagos();
  const dates = useServiceDates();
  const [picked, setPicked] = useState<string | null>(null);
  const [church, setChurch] = useState<ChurchGroup | 'all'>('all');
  const [hideContacted, setHideContacted] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [bulk, setBulk] = useState<Absentee[] | null>(null);

  // Open on the most recent date with check-ins (that is the Sunday you are following up)
  const datesSettled = dates.data !== undefined || dates.isError;
  const serviceDate = picked ?? dates.data?.[0] ?? today;
  const ready = picked !== null || datesSettled;

  const absentees = useAbsentees(serviceDate, church, { enabled: ready });
  const attendance = useAttendanceByDate(serviceDate);
  const { templates } = useMessageTemplates();
  const { mark, unmark } = useContactMutations();

  const saved = templates.absenceFollowUp;
  const template = draft ?? saved;
  const buildMessage = (person: Absentee) => buildFollowUpMessage(template, person, serviceDate);

  const rows = absentees.data;
  const pending = useMemo(() => (rows ?? []).filter((row) => row.contactedAt === null), [rows]);
  const shown = hideContacted ? pending : (rows ?? []);
  const contactedCount = (rows?.length ?? 0) - pending.length;
  const presentCount = attendance.data?.length;
  const nobodyCameThatDay = presentCount === 0;

  const contact = (person: Absentee, channel: ContactChannel) =>
    mark.mutate({ memberId: person.memberId, serviceDate, channel });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Follow-up"
        description={
          rows
            ? `${formatServiceDate(serviceDate)}: ${rows.length} absent, ${contactedCount} contacted, ${pending.length} still to contact`
            : formatServiceDate(serviceDate)
        }
        actions={
          <Button disabled={pending.length === 0} onClick={() => setBulk(pending)}>
            <Users className="mr-2 size-4" />
            Message all {pending.length > 0 ? `${pending.length} ` : ''}not yet contacted
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="fu-date">Service they missed</Label>
          <ServiceDateSelect
            id="fu-date"
            label="Service they missed"
            dates={dates.data ?? []}
            today={today}
            value={serviceDate}
            onChange={setPicked}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fu-church">Church</Label>
          <NativeSelect id="fu-church" value={church} onChange={(event) => setChurch(event.target.value as ChurchGroup | 'all')}>
            <option value="all">Both churches</option>
            {CHURCH_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </NativeSelect>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={hideContacted}
            onChange={(event) => setHideContacted(event.target.checked)}
          />
          Hide people already contacted
        </label>
      </div>

      {nobodyCameThatDay && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertDescription>
            No one was checked in on {formatServiceDate(serviceDate)}, so every member shows as absent. Check the date
            before you message anyone.
          </AlertDescription>
        </Alert>
      )}

      <MessageComposer
        value={template}
        onChange={setDraft}
        edited={draft !== null && draft !== saved}
        onReset={() => setDraft(null)}
        preview={rows && rows.length > 0 ? buildMessage(rows[0]) : null}
      />

      {(absentees.isPending || !ready) && (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="size-8" />
        </div>
      )}
      {absentees.isError && !rows && (
        <ErrorState message={getErrorMessage(absentees.error)} onRetry={() => void absentees.refetch()} />
      )}
      {rows && ready && (
        <AbsenteeList
          rows={shown}
          filtered={hideContacted && rows.length > 0}
          buildMessage={buildMessage}
          onContact={contact}
          onUndo={(person) => unmark.mutate({ memberId: person.memberId, serviceDate })}
        />
      )}

      {bulk && (
        <BulkSendPanel
          key={bulk.map((person) => person.memberId).join(',')}
          open
          onOpenChange={(open) => !open && setBulk(null)}
          queue={bulk}
          buildMessage={buildMessage}
          onSent={(person) => contact(person, 'whatsapp')}
        />
      )}
    </div>
  );
}

