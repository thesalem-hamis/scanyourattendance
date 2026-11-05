// import { z } from 'zod';
// import { AppError, toAppError } from '@/lib/error';
// import { supabase } from '@/lib/supabase';
// import type { ChurchGroup } from '@/types';

// /* ---------- check-in ---------- */

// const memberCardSchema = z.object({
//   id: z.string(),
//   full_name: z.string(),
//   church_group: z.enum(['Church 1', 'Church 2']),
//   member_code: z.string(),
// });

// /** What check_in_member() / check_in_by_token() are allowed to answer. */
// const checkInResultSchema = z.discriminatedUnion('result', [
//   z.object({ result: z.literal('checked_in'), member: memberCardSchema }),
//   z.object({ result: z.literal('already_checked_in'), member: memberCardSchema }),
//   z.object({ result: z.literal('inactive'), member: memberCardSchema }),
//   z.object({ result: z.literal('not_found') }),
// ]);

// export interface MemberCard {
//   id: string;
//   fullName: string;
//   churchGroup: ChurchGroup;
//   memberCode: string;
// }

// export type CheckInResult =
//   | { result: 'checked_in' | 'already_checked_in' | 'inactive'; member: MemberCard }
//   | { result: 'not_found' };

// export type CheckInInput = { kind: 'token'; token: string } | { kind: 'member'; memberId: string };

// /** Validates the database's JSON answer. Anything unexpected is an error, never a guess. */
// export function parseCheckInResult(data: unknown): CheckInResult {
//   const parsed = checkInResultSchema.safeParse(data);
//   if (!parsed.success) {
//     throw new AppError('Unexpected response from the server. Please try again.', 'unknown', parsed.error);
//   }
//   if (parsed.data.result === 'not_found') return { result: 'not_found' };

//   const { member } = parsed.data;
//   return {
//     result: parsed.data.result,
//     member: {
//       id: member.id,
//       fullName: member.full_name,
//       churchGroup: member.church_group,
//       memberCode: member.member_code,
//     },
//   };
// }

// export async function checkIn(input: CheckInInput): Promise<CheckInResult> {
//   const { data, error } =
//     input.kind === 'token'
//       ? await supabase.rpc('check_in_by_token', { p_token: input.token })
//       : await supabase.rpc('check_in_member', { p_member_id: input.memberId, p_method: 'manual_search' });
//   if (error) throw toAppError(error);
//   return parseCheckInResult(data);
// }

// /* ---------- manual search ---------- */

// export interface MemberSearchRow {
//   id: string;
//   memberCode: string;
//   fullName: string;
//   phone: string;
//   churchGroup: ChurchGroup;
//   isActive: boolean;
// }

// /**
//  * Turns what the usher typed into a PostgREST `or` filter, or null if it is too short to search.
//  * Phone numbers are matched on their digits without the leading 0, because the database stores
//  * +234 numbers (typing 0803... must still find +234803...).
//  */
// export function buildSearchFilter(raw: string): string | null {
//   // Characters that would break the filter syntax or act as wildcards
//   const cleaned = raw
//     .replace(/[,()*%\\"']/g, ' ')
//     .replace(/\s+/g, ' ')
//     .trim();
//   if (cleaned.length < 2) return null;

//   if (/^[\d\s+\-.]+$/.test(cleaned)) {
//     const digits = cleaned.replace(/\D/g, '').replace(/^0+/, '');
//     if (digits.length < 3) return null;
//     return `phone.ilike.*${digits}*,member_code.ilike.*${digits}*`;
//   }

//   return `full_name.ilike.*${cleaned}*,member_code.ilike.*${cleaned}*`;
// }

// export async function searchMembers(raw: string): Promise<MemberSearchRow[]> {
//   const filter = buildSearchFilter(raw);
//   if (!filter) return [];

//   const { data, error } = await supabase
//     .from('members')
//     .select('id, member_code, full_name, phone, church_group, status')
//     .or(filter)
//     .order('full_name')
//     .limit(20);
//   if (error) throw toAppError(error);

//   return data.map((row) => ({
//     id: row.id,
//     memberCode: row.member_code,
//     fullName: row.full_name,
//     phone: row.phone,
//     churchGroup: row.church_group,
//     isActive: row.status === 'active',
//   }));
// }

import { z } from 'zod';
import { AppError, toAppError } from '@/lib/error';
import { buildSearchFilter } from '@/lib/memberSearch';
import { supabase } from '@/lib/supabase';
import type { ChurchGroup } from '@/types';

/* ---------- check-in ---------- */

const memberCardSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  church_group: z.enum(['Church 1', 'Church 2']),
  member_code: z.string(),
});

/** What check_in_member() / check_in_by_token() are allowed to answer. */
const checkInResultSchema = z.discriminatedUnion('result', [
  z.object({ result: z.literal('checked_in'), member: memberCardSchema }),
  z.object({ result: z.literal('already_checked_in'), member: memberCardSchema }),
  z.object({ result: z.literal('inactive'), member: memberCardSchema }),
  z.object({ result: z.literal('not_found') }),
]);

export interface MemberCard {
  id: string;
  fullName: string;
  churchGroup: ChurchGroup;
  memberCode: string;
}

export type CheckInResult =
  | { result: 'checked_in' | 'already_checked_in' | 'inactive'; member: MemberCard }
  | { result: 'not_found' };

export type CheckInInput = { kind: 'token'; token: string } | { kind: 'member'; memberId: string };

/** Validates the database's JSON answer. Anything unexpected is an error, never a guess. */
export function parseCheckInResult(data: unknown): CheckInResult {
  const parsed = checkInResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError('Unexpected response from the server. Please try again.', 'unknown', parsed.error);
  }
  if (parsed.data.result === 'not_found') return { result: 'not_found' };

  const { member } = parsed.data;
  return {
    result: parsed.data.result,
    member: {
      id: member.id,
      fullName: member.full_name,
      churchGroup: member.church_group,
      memberCode: member.member_code,
    },
  };
}

export async function checkIn(input: CheckInInput): Promise<CheckInResult> {
  const { data, error } =
    input.kind === 'token'
      ? await supabase.rpc('check_in_by_token', { p_token: input.token })
      : await supabase.rpc('check_in_member', { p_member_id: input.memberId, p_method: 'manual_search' });
  if (error) throw toAppError(error);
  return parseCheckInResult(data);
}

/* ---------- manual search ---------- */

export { buildSearchFilter };

export interface MemberSearchRow {
  id: string;
  memberCode: string;
  fullName: string;
  phone: string;
  churchGroup: ChurchGroup;
  isActive: boolean;
}

export async function searchMembers(raw: string): Promise<MemberSearchRow[]> {
  const filter = buildSearchFilter(raw);
  if (!filter) return [];

  const { data, error } = await supabase
    .from('members')
    .select('id, member_code, full_name, phone, church_group, status')
    .or(filter)
    .order('full_name')
    .limit(20);
  if (error) throw toAppError(error);

  return data.map((row) => ({
    id: row.id,
    memberCode: row.member_code,
    fullName: row.full_name,
    phone: row.phone,
    churchGroup: row.church_group,
    isActive: row.status === 'active',
  }));
}