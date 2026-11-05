import { Loader2 } from 'lucide-react';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { Button } from '@/components/ui/button';
import { formatPhoneDisplay } from '@/lib/phone';
import type { MemberSearchRow } from '../services/checkinService';

interface SearchResultRowProps {
  row: MemberSearchRow;
  checkedIn: boolean;
  pending: boolean;
  onCheckIn: () => void;
}

export function SearchResultRow({ row, checkedIn, pending, onCheckIn }: SearchResultRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{row.fullName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <ChurchBadge church={row.churchGroup} />
          <span>{formatPhoneDisplay(row.phone)}</span>
          {!row.isActive && <span className="font-medium text-destructive">Inactive</span>}
        </div>
      </div>
      <Button
        size="sm"
        variant={checkedIn ? 'secondary' : 'default'}
        disabled={checkedIn || !row.isActive || pending}
        onClick={onCheckIn}
      >
        {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {checkedIn ? 'Checked in' : 'Check in'}
      </Button>
    </li>
  );
}
