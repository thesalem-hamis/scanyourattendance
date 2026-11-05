import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/common/NativeSelect';
import { CHURCH_GROUPS } from '@/config/churches';
import { getErrorMessage } from '@/lib/error';
import { formatPhoneDisplay } from '@/lib/phone';
import { useMemberMutations } from '../hooks/useMemberMutations';
import { memberFormSchema, type MemberFormValues } from '../schemas/memberSchema';
import type { MemberDetail } from '../services/memberService';

interface MemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The member being edited, or null to add a new one. */
  member: MemberDetail | null;
  /** Called with the member's id after a successful save. */
  onSaved: (id: string) => void;
}

export function MemberFormModal({ open, onOpenChange, member, onSaved }: MemberFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit member' : 'Add member'}</DialogTitle>
          <DialogDescription>
            {member ? 'Change their details. Their pass and attendance history stay the same.' : "They'll get a pass you can send straight away."}
          </DialogDescription>
        </DialogHeader>
        {/* key: a fresh form (fresh defaults) every time a different member is opened */}
        <MemberForm key={member?.id ?? 'new'} member={member} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MemberForm({
  member,
  onSaved,
  onCancel,
}: {
  member: MemberDetail | null;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const { create, update } = useMemberMutations();
  const mutation = member ? update : create;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: member
      ? {
          fullName: member.fullName,
          phone: formatPhoneDisplay(member.phone),
          age: member.age,
          gender: member.gender,
          churchGroup: member.churchGroup,
          consentGiven: false,
        }
      : { fullName: '', phone: '', age: null, consentGiven: false },
  });

  const onSubmit = (values: MemberFormValues) => {
    if (member) {
      update.mutate({ id: member.id, values }, { onSuccess: (id) => onSaved(id) });
    } else {
      create.mutate(values, { onSuccess: (id) => onSaved(id) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {mutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(mutation.error)}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="member-name">Full name</Label>
        <Input id="member-name" autoComplete="off" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="member-phone">Phone number</Label>
          <Input
            id="member-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="0803 123 4567"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-age">Age (optional)</Label>
          <Input
            id="member-age"
            type="number"
            inputMode="numeric"
            aria-invalid={Boolean(errors.age)}
            {...register('age', { setValueAs: (value) => (value === '' || value == null ? null : Number(value)) })}
          />
          {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="member-gender">Gender</Label>
          <NativeSelect id="member-gender" aria-invalid={Boolean(errors.gender)} {...register('gender')}>
            <option value="">Choose…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </NativeSelect>
          {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-church">Church</Label>
          <NativeSelect id="member-church" aria-invalid={Boolean(errors.churchGroup)} {...register('churchGroup')}>
            <option value="">Choose…</option>
            {CHURCH_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </NativeSelect>
          {errors.churchGroup && <p className="text-sm text-destructive">{errors.churchGroup.message}</p>}
        </div>
      </div>

      {!member && (
        <label className="flex items-start gap-3 text-sm leading-snug">
          <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" {...register('consentGiven')} />
          <span>They (or their parent or guardian) agreed to be on this list.</span>
        </label>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {member ? 'Save changes' : 'Add member'}
        </Button>
      </DialogFooter>
    </form>
  );
}
