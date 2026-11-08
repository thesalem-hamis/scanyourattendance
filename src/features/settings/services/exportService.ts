import { toLagosDate, formatTime } from '@/lib/dates';
import { toAppError, AppError } from '@/lib/error';
import { buildCsv } from '@/lib/exportCsv';
import { supabase } from '@/lib/supabase';
import type { CheckInMethod, ChurchGroup, Gender } from '@/types';

const PAGE_SIZE = 1000; // the most the database returns in one request
const MAX_PAGES = 100; // 100,000 rows: a safety stop, never reached in practice

/** Reads every row of a query, one page at a time. `fetchPage` must build a fresh query each call. */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw toAppError(error);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
  return all;
}

/* ---------- members ---------- */

export interface MemberExportRow {
  member_code: string;
  full_name: string;
  phone: string;
  age: number | null;
  gender: Gender;
  church_group: ChurchGroup;
  status: string;
  created_at: string;
  consent_at: string | null;
}

export async function fetchMembersForExport(): Promise<MemberExportRow[]> {
  return fetchAllPages<MemberExportRow>((from, to) =>
    supabase
      .from('members')
      .select('member_code, full_name, phone, age, gender, church_group, status, created_at, consent_at')
      .order('full_name')
      .order('id')
      .range(from, to),
  );
}

export function membersCsv(rows: readonly MemberExportRow[]): string {
  return buildCsv(
    ['Member code', 'Name', 'Phone', 'Age', 'Gender', 'Church', 'Status', 'Joined', 'Consent recorded'],
    rows.map((row) => [
      row.member_code,
      row.full_name,
      row.phone,
      row.age,
      row.gender,
      row.church_group,
      row.status,
      toLagosDate(row.created_at),
      row.consent_at ? toLagosDate(row.consent_at) : '',
    ]),
  );
}

/* ---------- attendance ---------- */

export interface AttendanceExportRow {
  service_date: string;
  check_in_time: string;
  check_in_method: CheckInMethod;
  members: { member_code: string; full_name: string; church_group: ChurchGroup } | null;
}

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function fetchAttendanceForExport({ from, to }: { from?: string; to?: string }): Promise<AttendanceExportRow[]> {
  if ((from && !isDate(from)) || (to && !isDate(to))) throw new AppError('Choose valid dates.', 'validation');
  if (from && to && from > to) throw new AppError('The "from" date must not be after the "to" date.', 'validation');

  return fetchAllPages<AttendanceExportRow>((start, end) => {
    let query = supabase
      .from('attendance')
      .select('service_date, check_in_time, check_in_method, members(member_code, full_name, church_group)');
    if (from) query = query.gte('service_date', from);
    if (to) query = query.lte('service_date', to);
    return query
      .order('service_date', { ascending: false })
      .order('check_in_time', { ascending: false })
      .order('id')
      .range(start, end)
      .overrideTypes<AttendanceExportRow[], { merge: false }>();
  });
}

export function attendanceCsv(rows: readonly AttendanceExportRow[]): string {
  return buildCsv(
    ['Date', 'Name', 'Member code', 'Church', 'Time', 'How'],
    rows.map((row) => [
      row.service_date,
      row.members?.full_name ?? '(removed member)',
      row.members?.member_code ?? '',
      row.members?.church_group ?? '',
      formatTime(row.check_in_time),
      row.check_in_method === 'qr_scan' ? 'Scanned' : 'Added by hand',
    ]),
  );
}
