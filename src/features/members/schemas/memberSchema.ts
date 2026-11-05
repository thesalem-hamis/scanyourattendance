import { z } from 'zod';
import { CHURCH_OPTIONS, GENDER_OPTIONS } from '@/features/registration';
import { normalizePhone } from '@/lib/phone';

/** The database accepts ages 1–24. (The public sign-up form is stricter: 8–24.) */
export const MEMBER_AGE_MIN = 1;
export const MEMBER_AGE_MAX = 24;

export const memberFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter a full name').max(100, 'That name is too long'),
  phone: z
    .string()
    .trim()
    .min(1, 'Enter a phone number')
    .refine((value) => normalizePhone(value) !== null, 'Enter a valid mobile number, e.g. 0803 123 4567'),
  /** Optional: empty becomes null. */
  age: z
    .number({ message: 'Enter a number, or leave it empty' })
    .int('Enter a whole number')
    .min(MEMBER_AGE_MIN, `Age must be at least ${MEMBER_AGE_MIN}`)
    .max(MEMBER_AGE_MAX, `Age must be ${MEMBER_AGE_MAX} or less`)
    .nullable(),
  gender: z.enum(GENDER_OPTIONS, { message: 'Choose one' }),
  churchGroup: z.enum(CHURCH_OPTIONS, { message: 'Choose a church' }),
  /** Only used when adding: records that the teen (or parent) agreed to be on the list. */
  consentGiven: z.boolean(),
});

export type MemberFormValues = z.infer<typeof memberFormSchema>;
