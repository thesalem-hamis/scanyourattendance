// import { toAppError } from '@/lib/error';
// import { supabase } from '@/lib/supabase';
// import type { CheckInMethod, ChurchGroup } from '@/types';

// export interface AttendanceRow {
//   id: string;
//   memberId: string;
//   fullName: string;
//   churchGroup: ChurchGroup;
//   memberCode: string;
//   checkInTime: string;
//   method: CheckInMethod;
// }

// /** Everyone who checked in on one service date, newest first. */
// export async function getAttendanceByDate(serviceDate: string): Promise<AttendanceRow[]> {
//   const { data, error } = await supabase
//     .from('attendance')
//     .select('id, member_id, check_in_time, check_in_method, members(full_name, church_group, member_code)')
//     .eq('service_date', serviceDate)
//     .order('check_in_time', { ascending: false });
//   if (error) throw toAppError(error);

//   return data.flatMap((row) => {
//     // `members` is null only if RLS hides the member; skip rather than show a blank row.
//     if (!row.members) return [];
//     return [
//       {
//         id: row.id,
//         memberId: row.member_id,
//         fullName: row.members.full_name,
//         churchGroup: row.members.church_group,
//         memberCode: row.members.member_code,
//         checkInTime: row.check_in_time,
//         method: row.check_in_method,
//       },
//     ];
//   });
// }


import { toAppError } from '@/lib/error';
import { supabase } from '@/lib/supabase';
import type { CheckInMethod, ChurchGroup } from '@/types';

export interface AttendanceRow {
  id: string;
  memberId: string;
  fullName: string;
  churchGroup: ChurchGroup;
  memberCode: string;
  checkInTime: string;
  method: CheckInMethod;
}

/**
 * The exact shape of one row returned by the query below.
 * Written by hand because TypeScript could not work out the joined `members` data on its own.
 * If you change the columns in the select, change this to match.
 */
type AttendanceJoinRow = {
  id: string;
  member_id: string;
  check_in_time: string;
  check_in_method: CheckInMethod;
  members: {
    full_name: string;
    church_group: ChurchGroup;
    member_code: string;
  } | null;
};

/** Everyone who checked in on one service date, newest first. */
export async function getAttendanceByDate(serviceDate: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, member_id, check_in_time, check_in_method, members(full_name, church_group, member_code)')
    .eq('service_date', serviceDate)
    .order('check_in_time', { ascending: false });
  if (error) throw toAppError(error);

  const rows = data as unknown as AttendanceJoinRow[];

  return rows.flatMap((row) => {
    // `members` is null only if RLS hides the member; skip rather than show a blank row.
    if (!row.members) return [];
    return [
      {
        id: row.id,
        memberId: row.member_id,
        fullName: row.members.full_name,
        churchGroup: row.members.church_group,
        memberCode: row.members.member_code,
        checkInTime: row.check_in_time,
        method: row.check_in_method,
      },
    ];
  });
}

// TODO: Type workaround. `AttendanceJoinRow` and the `as unknown as` cast above exist only
// because TypeScript couldn't type the joined `members(...)` data on its own.
// 1. If you change the columns in the .select(...), update AttendanceJoinRow to match,
//    because TypeScript no longer checks this query against the database.
// 2. After upgrading @supabase/supabase-js or TypeScript, try deleting the type and the cast.
//    If `npx tsc -b` stays clean, the workaround is no longer needed.