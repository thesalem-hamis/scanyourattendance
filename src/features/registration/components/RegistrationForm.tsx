import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/config/routes';
import { getErrorMessage } from '@/lib/error';
import { formatPhoneDisplay, normalizePhone } from '@/lib/phone';
import { getRememberedPass, rememberPass } from '@/features/pass';
import { useRegisterMember } from '../hooks/useRegisterMember';
import {
  CHURCH_OPTIONS,
  GENDER_OPTIONS,
  registerSchema,
  type RegisterValues,
} from '../schemas/registerSchema';
import { AlreadyRegisteredNotice } from './AlreadyRegisteredNotice';
import { ChoiceField, type ChoiceOption } from './ChoiceField';
import { ConsentCheckbox } from './ConsentCheckbox';

const GENDER_CHOICES: readonly ChoiceOption[] = GENDER_OPTIONS.map((value) => ({ value, label: value }));

// Full class names on purpose, so Tailwind can find them.
const CHURCH_CHOICES: readonly ChoiceOption[] = [
  {
    value: CHURCH_OPTIONS[0],
    label: CHURCH_OPTIONS[0],
    checkedClassName: 'peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white',
  },
  {
    value: CHURCH_OPTIONS[1],
    label: CHURCH_OPTIONS[1],
    checkedClassName: 'peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-checked:text-amber-950',
  },
];

export function RegistrationForm() {
  const navigate = useNavigate();
  const registration = useRegisterMember();
  const [rememberedToken] = useState(() => getRememberedPass());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', consent: false, website: '' },
  });

  const phonePreview = normalizePhone(watch('phone') ?? '');

  const onSubmit = (values: RegisterValues) => {
    registration.mutate(values, {
      onSuccess: (outcome) => {
        if (outcome.result === 'created') {
          rememberPass(outcome.qrToken);
          navigate(ROUTES.pass(outcome.qrToken), { replace: true });
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {registration.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(registration.error)}</AlertDescription>
        </Alert>
      )}
      {registration.data?.result === 'exists' && <AlreadyRegisteredNotice rememberedToken={rememberedToken} />}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          {...register('fullName')}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0803 123 4567"
          aria-invalid={Boolean(errors.phone)}
          {...register('phone')}
        />
        {errors.phone ? (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        ) : (
          phonePreview && (
            <p className="text-xs text-muted-foreground">We'll save it as {formatPhoneDisplay(phonePreview)}</p>
          )
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          inputMode="numeric"
          min={8}
          max={24}
          aria-invalid={Boolean(errors.age)}
          {...register('age', { valueAsNumber: true })}
        />
        {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
      </div>

      <ChoiceField
        legend="Gender"
        options={GENDER_CHOICES}
        registration={register('gender')}
        error={errors.gender?.message}
      />

      <ChoiceField
        legend="Which church do you attend?"
        options={CHURCH_CHOICES}
        registration={register('churchGroup')}
        error={errors.churchGroup?.message}
      />

      <ConsentCheckbox registration={register('consent')} error={errors.consent?.message} />

      {/* Honeypot: invisible to people, irresistible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={registration.isPending}>
        {registration.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Get my pass
      </Button>
    </form>
  );
}