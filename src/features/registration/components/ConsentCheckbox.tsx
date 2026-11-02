import type { UseFormRegisterReturn } from 'react-hook-form';
import { APP_NAME } from '@/config/constants';

interface ConsentCheckboxProps {
  registration: UseFormRegisterReturn;
  error?: string;
}

export function ConsentCheckbox({ registration, error }: ConsentCheckboxProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-3 text-sm leading-snug">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" {...registration} />
        <span>
          I agree that {APP_NAME} may keep my name, phone number and age to record attendance and contact me about
          church activities. If I'm under 18, my parent or guardian knows I'm registering.
        </span>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
