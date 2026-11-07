import { z } from 'zod';
import { todayInLagos } from '@/lib/dates';
import { AppError, toAppError } from '@/lib/error';
import { supabase } from '@/lib/supabase';

/**
 * Admin-only attendance operations. (Kept apart from attendanceService.ts, which the
 * check-in screen and the dashboard use for reading a day's list.)
 */

const dateList = z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

/** The most recent dates that have at least one check-in, newest first. */
export async function getServiceDates(limit = 60): Promise<string[]> {
  const { data, error } = await supabase.rpc('service_dates', { p_limit: limit });
  if (error) throw toAppError(error);
  const parsed = dateList.safeParse(data);
  if (!parsed.success) throw new AppError('Unexpected response from the server. Please try again.', 'unknown', parsed.error);
  return parsed.data;
}

/** Records that a member was there on a given date (a correction, e.g. from a paper list). */
export async function addAttendance({ memberId, serviceDate }: { memberId: string; serviceDate: string }): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) throw new AppError('Choose a valid date.', 'validation');
  if (serviceDate > todayInLagos()) throw new AppError("You can't record attendance for a future date.", 'validation');

  const { error } = await supabase
    .from('attendance')
    .insert({ member_id: memberId, service_date: serviceDate, check_in_method: 'manual_search' });

  if (error) {
    // unique(member_id, service_date): the database refuses a second check-in for the same day
    if (error.code === '23505') throw new AppError('That member is already checked in for this date.', 'conflict', error);
    throw toAppError(error);
  }
}

export async function removeAttendance(attendanceId: string): Promise<void> {
  const { data, error } = await supabase.from('attendance').delete().eq('id', attendanceId).select('id').maybeSingle();
  if (error) throw toAppError(error);
  // Row-level security silently hides rows you may not delete, so "nothing came back" means "not allowed"
  if (!data) throw new AppError("You don't have permission to remove this check-in.", 'permission');
}