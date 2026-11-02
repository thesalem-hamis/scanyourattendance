import { z } from 'zod';
import { AppError, toAppError } from '@/lib/error';
import { normalizePhone } from '@/lib/phone';
import { PASS_TOKEN_PATTERN } from '@/lib/qr';
import { supabase } from '@/lib/supabase';
import type { RegisterValues } from '../schemas/registerSchema';

/** What register_member() is allowed to answer. Anything else is treated as an error. */
const registerResultSchema = z.discriminatedUnion('result', [
  z.object({ result: z.literal('created'), qr_token: z.string().regex(PASS_TOKEN_PATTERN) }),
  z.object({ result: z.literal('exists') }),
]);

export type RegisterOutcome = { result: 'created'; qrToken: string } | { result: 'exists' };

export async function registerMember(values: RegisterValues): Promise<RegisterOutcome> {
  // Honeypot: a real person never sees this field. Pretend nothing happened.
  if (values.website) return { result: 'exists' };

  const phone = normalizePhone(values.phone);
  if (!phone) throw new AppError('Enter a valid phone number.', 'validation');

  const { data, error } = await supabase.rpc('register_member', {
    p_full_name: values.fullName.trim(),
    p_phone: phone,
    p_age: values.age,
    p_gender: values.gender,
    p_church_group: values.churchGroup,
    p_consent: values.consent,
  });
  if (error) throw toAppError(error);

  const parsed = registerResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError('Unexpected response from the server. Please try again.', 'unknown', parsed.error);
  }

  return parsed.data.result === 'created'
    ? { result: 'created', qrToken: parsed.data.qr_token.toLowerCase() }
    : { result: 'exists' };
}