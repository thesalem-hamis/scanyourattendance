import type { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

export interface ChoiceOption {
  value: string;
  label: string;
  /** Extra classes for the selected state. Write full `peer-checked:` class names so Tailwind sees them. */
  checkedClassName?: string;
}

interface ChoiceFieldProps {
  legend: string;
  options: readonly ChoiceOption[];
  registration: UseFormRegisterReturn;
  error?: string;
}

const DEFAULT_CHECKED = 'peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground';

/**
 * Big tappable radio choices (better than a dropdown on a phone).
 * Native radios, so it works directly with react-hook-form's register().
 */
export function ChoiceField({ legend, options, registration, error }: ChoiceFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label key={option.value}>
            <input type="radio" value={option.value} className="peer sr-only" {...registration} />
            <span
              className={cn(
                'flex h-11 cursor-pointer items-center justify-center rounded-lg border bg-background text-sm font-medium transition-colors',
                'hover:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                option.checkedClassName ?? DEFAULT_CHECKED,
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}