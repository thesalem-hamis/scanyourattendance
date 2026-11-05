import { CHURCH_GROUPS } from '@/config/churches';
import { NativeSelect } from '@/components/common/NativeSelect';
import { SearchInput } from '@/components/common/SearchInput';
import type { ChurchGroup } from '@/types';
import type { StatusFilter } from '../services/memberService';

interface MemberFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  church: ChurchGroup | 'all';
  onChurchChange: (value: ChurchGroup | 'all') => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
}

export function MemberFilters({
  search,
  onSearchChange,
  church,
  onChurchChange,
  status,
  onStatusChange,
}: MemberFiltersProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_11rem_11rem]">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search name, phone or code"
        label="Search members"
      />
      <NativeSelect
        aria-label="Filter by church"
        value={church}
        onChange={(event) => onChurchChange(event.target.value as ChurchGroup | 'all')}
      >
        <option value="all">Both churches</option>
        {CHURCH_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Filter by status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="all">All statuses</option>
      </NativeSelect>
    </div>
  );
}
