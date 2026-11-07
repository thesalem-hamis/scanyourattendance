import { z } from 'zod';
import { CHURCH_GROUPS } from '@/config/churches';
import { formatShortDate } from '@/lib/dates';
import { AppError, toAppError } from '@/lib/error';
import { ratio } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { ChurchGroup } from '@/types';

const church = z.enum(['Church 1', 'Church 2']);

const summaryRows = z.array(z.object({ church_group: church, attended: z.number(), roster: z.number() }));
const trendRows = z.array(z.object({ service_date: z.string(), church_group: church, attended: z.number() }));
const membershipRows = z.array(
  z.object({
    church_group: church,
    active_members: z.number(),
    inactive_members: z.number(),
    male_members: z.number(),
    female_members: z.number(),
    new_last_7_days: z.number(),
    new_last_30_days: z.number(),
  }),
);

const unexpected = (cause: unknown) =>
  new AppError('Unexpected response from the server. Please try again.', 'unknown', cause);

/* ---------- attendance for one day ---------- */

export interface ChurchAttendance {
  churchGroup: ChurchGroup;
  attended: number;
  /** Everyone who could have come: active members, plus anyone who came that day. */
  roster: number;
  /** attended / roster, 0 to 1. Null when the church has nobody on the list. */
  turnout: number | null;
  /** This church's part of everybody who came that day, 0 to 1. Null when nobody came. */
  share: number | null;
}

export interface AttendanceSummary {
  serviceDate: string;
  /** Always both churches, in the same order. */
  churches: ChurchAttendance[];
  total: { attended: number; roster: number; turnout: number | null };
}

export function buildSummary(
  serviceDate: string,
  rows: readonly { church_group: ChurchGroup; attended: number; roster: number }[],
): AttendanceSummary {
  const totalAttended = rows.reduce((sum, row) => sum + row.attended, 0);
  const totalRoster = rows.reduce((sum, row) => sum + row.roster, 0);

  return {
    serviceDate,
    churches: CHURCH_GROUPS.map((group) => {
      const row = rows.find((r) => r.church_group === group);
      const attended = row?.attended ?? 0;
      const roster = row?.roster ?? 0;
      return { churchGroup: group, attended, roster, turnout: ratio(attended, roster), share: ratio(attended, totalAttended) };
    }),
    total: { attended: totalAttended, roster: totalRoster, turnout: ratio(totalAttended, totalRoster) },
  };
}

export async function getAttendanceSummary(serviceDate: string): Promise<AttendanceSummary> {
  const { data, error } = await supabase.rpc('attendance_summary', { p_date: serviceDate });
  if (error) throw toAppError(error);
  const parsed = summaryRows.safeParse(data);
  if (!parsed.success) throw unexpected(parsed.error);
  return buildSummary(serviceDate, parsed.data);
}

/* ---------- Sunday-by-Sunday trend ---------- */

export interface TrendPoint {
  serviceDate: string;
  /** Short label for the chart axis, e.g. "1 Nov". */
  label: string;
  'Church 1': number;
  'Church 2': number;
  total: number;
}

/** One point per date, oldest first (charts read left to right). */
export function buildTrend(
  rows: readonly { service_date: string; church_group: ChurchGroup; attended: number }[],
): TrendPoint[] {
  const byDate = new Map<string, TrendPoint>();
  for (const row of rows) {
    const point =
      byDate.get(row.service_date) ??
      { serviceDate: row.service_date, label: formatShortDate(row.service_date), 'Church 1': 0, 'Church 2': 0, total: 0 };
    point[row.church_group] += row.attended;
    point.total += row.attended;
    byDate.set(row.service_date, point);
  }
  return [...byDate.values()].sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
}

export async function getAttendanceTrend(limit: number): Promise<TrendPoint[]> {
  const { data, error } = await supabase.rpc('attendance_trend', { p_limit: limit });
  if (error) throw toAppError(error);
  const parsed = trendRows.safeParse(data);
  if (!parsed.success) throw unexpected(parsed.error);
  return buildTrend(parsed.data);
}

/* ---------- how big each church is ---------- */

export interface MembershipRow {
  churchGroup: ChurchGroup | 'Combined';
  active: number;
  inactive: number;
  male: number;
  female: number;
  newLast7Days: number;
  newLast30Days: number;
}

export interface MembershipStrengthData {
  churches: MembershipRow[];
  combined: MembershipRow;
}

export function buildMembership(
  rows: readonly {
    church_group: ChurchGroup;
    active_members: number;
    inactive_members: number;
    male_members: number;
    female_members: number;
    new_last_7_days: number;
    new_last_30_days: number;
  }[],
): MembershipStrengthData {
  const churches: MembershipRow[] = CHURCH_GROUPS.map((group) => {
    const row = rows.find((r) => r.church_group === group);
    return {
      churchGroup: group,
      active: row?.active_members ?? 0,
      inactive: row?.inactive_members ?? 0,
      male: row?.male_members ?? 0,
      female: row?.female_members ?? 0,
      newLast7Days: row?.new_last_7_days ?? 0,
      newLast30Days: row?.new_last_30_days ?? 0,
    };
  });

  const sum = (pick: (row: MembershipRow) => number) => churches.reduce((total, row) => total + pick(row), 0);
  return {
    churches,
    combined: {
      churchGroup: 'Combined',
      active: sum((r) => r.active),
      inactive: sum((r) => r.inactive),
      male: sum((r) => r.male),
      female: sum((r) => r.female),
      newLast7Days: sum((r) => r.newLast7Days),
      newLast30Days: sum((r) => r.newLast30Days),
    },
  };
}

export async function getMembershipStrength(): Promise<MembershipStrengthData> {
  const { data, error } = await supabase.rpc('membership_strength');
  if (error) throw toAppError(error);
  const parsed = membershipRows.safeParse(data);
  if (!parsed.success) throw unexpected(parsed.error);
  return buildMembership(parsed.data);
}
