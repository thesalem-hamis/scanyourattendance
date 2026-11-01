import type { Database } from './database.types';

export type { Database } from './database.types';

type PublicSchema = Database['public'];

export type Profile = PublicSchema['Tables']['profiles']['Row'];
export type Member = PublicSchema['Tables']['members']['Row'];
export type AttendanceRecord = PublicSchema['Tables']['attendance']['Row'];

export type StaffRole = PublicSchema['Enums']['staff_role_enum'];
export type ChurchGroup = PublicSchema['Enums']['church_group_enum'];
export type Gender = PublicSchema['Enums']['gender_enum'];
export type CheckInMethod = PublicSchema['Enums']['checkin_method_enum'];

export interface DashboardStats {
  totalMembers: number;
  church1Members: number;
  church2Members: number;
  todayAttendance: number;
  church1AttendanceToday: number;
  church2AttendanceToday: number;
}

