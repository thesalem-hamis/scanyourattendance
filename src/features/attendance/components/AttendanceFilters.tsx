import { CHURCH_GROUPS } from '@/config/churches';
import { NativeSelect } from '@/components/common/NativeSelect';
import { SearchInput } from '@/components/common/SearchInput';
import { ServiceDateSelect } from '@/components/common/ServiceDateSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ChurchGroup } from '@/types';

interface AttendanceFiltersProps {
  dates: readonly string[];
  today: string;
  serviceDate: string;
  onServiceDateChange: (serviceDate: string) => void;
  church: ChurchGroup | 'all';
  onChurchChange: (church: ChurchGroup | 'all') => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function AttendanceFilters({
  dates,
  today,
  serviceDate,
  onServiceDateChange,
  church,
  onChurchChange,
  search,
  onSearchChange,
}: AttendanceFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="att-date">Service date</Label>
        <ServiceDateSelect id="att-date" label="Service date" dates={dates} today={today} value={serviceDate} onChange={onServiceDateChange} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="att-jump">Or jump to any date</Label>
        <Input
          id="att-jump"
          type="date"
          max={today}
          value={serviceDate}
          onChange={(event) => event.target.value && onServiceDateChange(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="att-church">Church</Label>
        <NativeSelect id="att-church" value={church} onChange={(event) => onChurchChange(event.target.value as ChurchGroup | 'all')}>
          <option value="all">Both churches</option>
          {CHURCH_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="att-search">Find a name</Label>
        <SearchInput value={search} onChange={onSearchChange} placeholder="Search this day's list" label="Find a name in this day's list" />
      </div>
    </div>
  );
}
