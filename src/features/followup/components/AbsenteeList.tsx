import { PartyPopper } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import type { Absentee, ContactChannel } from '../services/followupService';
import { AbsenteeRow } from './AbsenteeRow';

interface AbsenteeListProps {
  rows: Absentee[];
  /** True when some rows are hidden by "hide contacted". */
  filtered: boolean;
  buildMessage: (absentee: Absentee) => string;
  onContact: (absentee: Absentee, channel: ContactChannel) => void;
  onUndo: (absentee: Absentee) => void;
}

export function AbsenteeList({ rows, filtered, buildMessage, onContact, onUndo }: AbsenteeListProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={PartyPopper}
        title={filtered ? 'Everyone has been contacted' : 'No one was absent'}
        description={
          filtered
            ? 'Untick "Hide people already contacted" to see them again.'
            : 'Every active member on this list checked in.'
        }
      />
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-background" aria-label="Absent members">
      {rows.map((absentee) => (
        <AbsenteeRow
          key={absentee.memberId}
          absentee={absentee}
          message={buildMessage(absentee)}
          onContact={(channel) => onContact(absentee, channel)}
          onUndo={() => onUndo(absentee)}
        />
      ))}
    </ul>
  );
}