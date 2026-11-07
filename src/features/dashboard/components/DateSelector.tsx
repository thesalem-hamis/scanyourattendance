import { ServiceDateSelect } from '@/components/common/ServiceDateSelect';
import { useServiceDates } from '@/features/attendance';
import { todayInLagos } from '@/lib/dates';

interface DateSelectorProps {
  value: string;
  onChange: (serviceDate: string) => void;
}

/** Pick which service date the dashboard shows. */
export function DateSelector({ value, onChange }: DateSelectorProps) {
  const { data: dates } = useServiceDates();
  return (
    <ServiceDateSelect
      label="Service date"
      dates={dates ?? []}
      today={todayInLagos()}
      value={value}
      onChange={onChange}
    />
  );
}