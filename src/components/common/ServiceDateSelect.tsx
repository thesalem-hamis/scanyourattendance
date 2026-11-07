import { NativeSelect } from '@/components/common/NativeSelect';
import { formatServiceDate } from '@/lib/dates';

export interface DateOption {
  value: string;
  label: string;
}

/**
 * Every date the picker offers: dates that have check-ins, today (even if nobody has
 * checked in yet), and the currently chosen date (it may be one the admin typed in).
 * Newest first, no repeats.
 */
export function buildDateOptions(dates: readonly string[], today: string, selected?: string): DateOption[] {
  const all = new Set<string>([today, ...dates]);
  if (selected) all.add(selected);
  return [...all]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({
      value,
      label: value === today ? `${formatServiceDate(value)} (today)` : formatServiceDate(value),
    }));
}

interface ServiceDateSelectProps {
  id?: string;
  label: string;
  dates: readonly string[];
  today: string;
  value: string;
  onChange: (date: string) => void;
}

export function ServiceDateSelect({ id, label, dates, today, value, onChange }: ServiceDateSelectProps) {
  return (
    <NativeSelect id={id} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      {buildDateOptions(dates, today, value).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}