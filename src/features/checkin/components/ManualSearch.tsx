import { useState } from 'react';
import { Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/lib/error';
import { useMemberSearch } from '../hooks/useMemberSearch';
import { buildSearchFilter } from '../services/checkinService';
import { SearchResultRow } from './SearchResultRow';

interface ManualSearchProps {
  /** Members already checked in today (so their button shows "Checked in"). */
  checkedInIds: ReadonlySet<string>;
  /** The member whose check-in is being sent right now, if any. */
  pendingMemberId: string | null;
  onCheckIn: (memberId: string) => void;
}

/** For teens without a phone or a working pass: find them by name or phone number. */
export function ManualSearch({ checkedInIds, pendingMemberId, onCheckIn }: ManualSearchProps) {
  const [text, setText] = useState('');
  const query = useDebounce(text, 300);
  const search = useMemberSearch(query);
  const canSearch = buildSearchFilter(query) !== null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Name or phone number"
          autoComplete="off"
          autoFocus
          className="pl-9"
          aria-label="Search members by name or phone number"
        />
      </div>

      {!canSearch && (
        <p className="text-sm text-muted-foreground">Type at least 2 letters of a name, or 3 digits of a phone number.</p>
      )}

      {canSearch && search.isPending && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {canSearch && search.isError && <p className="text-sm text-destructive">{getErrorMessage(search.error)}</p>}

      {canSearch && search.data && search.data.length === 0 && !search.isFetching && (
        <p className="text-sm text-muted-foreground">No one found. Try fewer letters.</p>
      )}

      {canSearch && search.data && search.data.length > 0 && (
        <ul className="divide-y rounded-lg border bg-background px-3">
          {search.data.map((row) => (
            <SearchResultRow
              key={row.id}
              row={row}
              checkedIn={checkedInIds.has(row.id)}
              pending={pendingMemberId === row.id}
              onCheckIn={() => onCheckIn(row.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
