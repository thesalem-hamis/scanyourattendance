import { AppError, toAppError } from '@/lib/error';
import { normalizePhone } from '@/lib/phone';
import { buildSearchFilter } from '@/lib/memberSearch';
import { supabase } from '@/lib/supabase';
import type { CheckInMethod, ChurchGroup, Gender } from '@/types';
import type { MemberFormValues } from '../schemas/memberSchema';

export type StatusFilter = 'active' | 'inactive' | 'all';

export interface MemberFilters {
  search: string;
  church: ChurchGroup | 'all';
  status: StatusFilter;
  /** Zero-based. */
  page: number;
  pageSize: number;
}

export interface MemberListRow {
  id: string;
  memberCode: string;
  fullName: string;
  phone: string;
  age: number | null;
  gender: Gender;
  churchGroup: ChurchGroup;
  isActive: boolean;
  createdAt: string;
}

export interface MemberDetail extends MemberListRow {
  qrToken: string;
  consentAt: string | null;
}

export interface MemberAttendanceItem {
  id: string;
  serviceDate: string;
  checkInTime: string;
  method: CheckInMethod;
}

const LIST_COLUMNS = 'id, member_code, full_name, phone, age, gender, church_group, status, created_at';

interface ListColumns {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  age: number | null;
  gender: Gender;
  church_group: ChurchGroup;
  status: string;
  created_at: string;
}

const toListRow = (row: ListColumns): MemberListRow => ({
  id: row.id,
  memberCode: row.member_code,
  fullName: row.full_name,
  phone: row.phone,
  age: row.age,
  gender: row.gender,
  churchGroup: row.church_group,
  isActive: row.status === 'active',
  createdAt: row.created_at,
});

/** A duplicate phone number is the one database error an admin will actually hit; say it plainly. */
function toMemberError(error: unknown): AppError {
  const message = typeof (error as { message?: unknown })?.message === 'string' ? (error as { message: string }).message : '';
  if (message.includes('members_phone_unique')) {
    return new AppError('A member with that phone number already exists.', 'conflict', error);
  }
  return toAppError(error);
}

/** One page of members, filtered and searched on the server. */
export async function listMembers(filters: MemberFilters): Promise<{ rows: MemberListRow[]; total: number }> {
  let query = supabase.from('members').select(LIST_COLUMNS, { count: 'exact' });

  if (filters.church !== 'all') query = query.eq('church_group', filters.church);
  if (filters.status !== 'all') query = query.eq('status', filters.status);

  const search = buildSearchFilter(filters.search);
  if (search) query = query.or(search);

  const from = filters.page * filters.pageSize;
  const { data, error, count } = await query
    .order('full_name')
    .order('id') // tie-breaker so pages never overlap or skip
    .range(from, from + filters.pageSize - 1);
  if (error) throw toAppError(error);

  return { rows: data.map(toListRow), total: count ?? 0 };
}

export async function getMember(id: string): Promise<MemberDetail> {
  const { data, error } = await supabase
    .from('members')
    .select(`${LIST_COLUMNS}, qr_token, consent_at`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw toAppError(error);
  if (!data) throw new AppError('That member could not be found.', 'validation');

  return { ...toListRow(data), qrToken: data.qr_token, consentAt: data.consent_at };
}

export async function createMember(values: MemberFormValues): Promise<string> {
  const phone = normalizePhone(values.phone);
  if (!phone) throw new AppError('Enter a valid phone number.', 'validation');

  const { data, error } = await supabase
    .from('members')
    .insert({
      full_name: values.fullName.trim(),
      phone,
      age: values.age,
      gender: values.gender,
      church_group: values.churchGroup,
      consent_at: values.consentGiven ? new Date().toISOString() : null,
    })
    .select('id')
    .single();
  if (error) throw toMemberError(error);
  return data.id;
}

export async function updateMember(id: string, values: MemberFormValues): Promise<string> {
  const phone = normalizePhone(values.phone);
  if (!phone) throw new AppError('Enter a valid phone number.', 'validation');

  const { data, error } = await supabase
    .from('members')
    .update({
      full_name: values.fullName.trim(),
      phone,
      age: values.age,
      gender: values.gender,
      church_group: values.churchGroup,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw toMemberError(error);
  // Row-level security silently hides rows you may not change, so "no row back" means "not allowed"
  if (!data) throw new AppError("You don't have permission to change this member.", 'permission');
  return data.id;
}

export async function setMemberStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
  const { data, error } = await supabase.from('members').update({ status }).eq('id', id).select('id').maybeSingle();
  if (error) throw toAppError(error);
  if (!data) throw new AppError("You don't have permission to change this member.", 'permission');
}

const HISTORY_LIMIT = 20;

/** A member's most recent check-ins, plus how many there are in total. */
export async function getMemberHistory(
  memberId: string,
): Promise<{ rows: MemberAttendanceItem[]; total: number }> {
  const { data, error, count } = await supabase
    .from('attendance')
    .select('id, service_date, check_in_time, check_in_method', { count: 'exact' })
    .eq('member_id', memberId)
    .order('service_date', { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error) throw toAppError(error);

  return {
    rows: data.map((row) => ({
      id: row.id,
      serviceDate: row.service_date,
      checkInTime: row.check_in_time,
      method: row.check_in_method,
    })),
    total: count ?? 0,
  };
}