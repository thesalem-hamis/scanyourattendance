import {
  ClipboardCheck,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from './routes';

export const APP_NAME = 'Scan Your Attendance';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', to: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { label: 'Members', to: ROUTES.admin.members, icon: Users },
  { label: 'Attendance', to: ROUTES.admin.attendance, icon: ClipboardCheck },
  { label: 'Follow-up', to: ROUTES.admin.followUp, icon: MessageCircle },
  { label: 'Settings', to: ROUTES.admin.settings, icon: Settings },
];