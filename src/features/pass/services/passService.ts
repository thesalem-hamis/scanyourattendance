import { z } from 'zod';
import { AppError, toAppError } from '@/lib/error';
import { isPassToken } from '@/lib/qr';
import { supabase } from '@/lib/supabase';
import type { ChurchGroup } from '@/types';

const passSchema = z.object({
  full_name: z.string(),
  church_group: z.enum(['Church 1', 'Church 2']),
  member_code: z.string(),
  qr_token: z.string(),
});

export interface Pass {
  fullName: string;
  churchGroup: ChurchGroup;
  memberCode: string;
  qrToken: string;
}

/** Returns the pass for a token, or null if the token is malformed, unknown or the member is inactive. */
export async function getPass(token: string): Promise<Pass | null> {
  if (!isPassToken(token)) return null; // don't bother the database with junk

  const { data, error } = await supabase.rpc('get_pass', { p_token: token.toLowerCase() });
  if (error) throw toAppError(error);
  if (data === null) return null;

  const parsed = passSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError('Unexpected response from the server. Please try again.', 'unknown', parsed.error);
  }

  return {
    fullName: parsed.data.full_name,
    churchGroup: parsed.data.church_group,
    memberCode: parsed.data.member_code,
    qrToken: parsed.data.qr_token,
  };
}