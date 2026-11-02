import { z } from 'zod';
import { normalizePhone } from '@/lib/phone';

export const GENDER_OPTIONS = ['Male', 'Female'] as const;
export const CHURCH_OPTIONS = ['Church 1', 'Church 2'] as const;
export const AGE_MIN = 8;
export const AGE_MAX = 24;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100, 'That name is too long'),
  phone: z
    .string()
    .trim()
    .min(1, 'Enter your phone number')
    .refine((value) => normalizePhone(value) !== null, 'Enter a valid mobile number, e.g. 0803 123 4567'),
  age: z
    .number({ message: 'Enter your age' })
    .int('Enter a whole number')
    .min(AGE_MIN, `Age must be at least ${AGE_MIN}`)
    .max(AGE_MAX, `Age must be ${AGE_MAX} or less`),
  gender: z.enum(GENDER_OPTIONS, { message: 'Choose one' }),
  churchGroup: z.enum(CHURCH_OPTIONS, { message: 'Choose your church' }),
  consent: z.boolean().refine((value) => value === true, 'Please tick this box to continue'),
  /** Honeypot: hidden from people, filled in by bots. Must stay empty. */
  website: z.string().optional(),
});

export type RegisterValues = z.infer<typeof registerSchema>;
