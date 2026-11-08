import { z } from 'zod';
import { AppError, toAppError } from '@/lib/error';
import { supabase } from '@/lib/supabase';
import type { ChurchGroup } from '@/types';

export type ContactChannel = 'whatsapp' | 'sms' | 'call' | 'other';

const absenteeRows = z.array(
  z.object({
    member_id: z.string(),
    member_code: z.string(),
    full_name: z.string(),
    phone: z.string(),
    church_group: z.enum(['Church 1', 'Church 2']),
    last_attended: z.string().nullable(),
    contacted_at: z.string().nullable(),
    contacted_channel: z.enum(['whatsapp', 'sms', 'call', 'other']).nullable(),
  }),
);

export interface Absentee {
  memberId: string;
  memberCode: string;
  fullName: string;
  /** E.164, e.g. +2348031234567 */
  phone: string;
  churchGroup: ChurchGroup;
  /** The last date they came before the date being looked at, or null if they never have. */
  lastAttended: string | null;
  contactedAt: string | null;
  contactedChannel: ContactChannel | null;
}

/** Active members who did not check in on `serviceDate`, with whether someone has contacted them. */
export async function getAbsentees(serviceDate: string, church: ChurchGroup | 'all'): Promise<Absentee[]> {
  const { data, error } = await supabase.rpc('absentees', {
    p_date: serviceDate,
    ...(church === 'all' ? {} : { p_church: church }),
  });
  if (error) throw toAppError(error);

  const parsed = absenteeRows.safeParse(data);
  if (!parsed.success) {
    throw new AppError('Unexpected response from the server. Please try again.', 'unknown', parsed.error);
  }

  return parsed.data.map((row) => ({
    memberId: row.member_id,
    memberCode: row.member_code,
    fullName: row.full_name,
    phone: row.phone,
    churchGroup: row.church_group,
    lastAttended: row.last_attended,
    contactedAt: row.contacted_at,
    contactedChannel: row.contacted_channel,
  }));
}

export interface ContactInput {
  memberId: string;
  /** The date they missed. */
  serviceDate: string;
  channel: ContactChannel;
}

/** Records that someone reached out. Doing it again for the same date just updates the record. */
export async function markContacted({ memberId, serviceDate, channel }: ContactInput): Promise<void> {
  const { error } = await supabase
    .from('followups')
    .upsert({ member_id: memberId, service_date: serviceDate, channel }, { onConflict: 'member_id,service_date' });
  if (error) throw toAppError(error);
}

export async function unmarkContacted({ memberId, serviceDate }: Omit<ContactInput, 'channel'>): Promise<void> {
  const { error } = await supabase.from('followups').delete().eq('member_id', memberId).eq('service_date', serviceDate);
  if (error) throw toAppError(error);
}
