import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_ITEMS, APP_NAME } from '@/config/constants';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold">{APP_NAME}</span>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Main">
        {ADMIN_NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}