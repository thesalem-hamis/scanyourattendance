export type ChurchGroup = 'Church 1' | 'Church 2';

export interface Member {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email?: string | null;
  gender?: 'Male' | 'Female' | null;
  church_name: ChurchGroup;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  member_id: string;
  service_date: string;
  check_in_time: string;
  check_in_method: 'qr_scan' | 'manual_search' | 'self_form';
  member?: Member; // Joined relation
}

export interface DashboardStats {
  totalMembers: number;
  church1Members: number;
  church2Members: number;
  todayAttendance: number;
  church1AttendanceToday: number;
  church2AttendanceToday: number;
}