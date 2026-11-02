import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout, useSession } from '@/features/auth';

export function UserMenu() {
  const auth = useSession();
  const logout = useLogout();

  if (auth.status !== 'signedIn') return null;

  const name = auth.profile.full_name?.trim() || auth.session.user.email || 'Account';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" className="rounded-full" aria-label="Account menu" />}
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Base UI: a label must live inside a Group, otherwise it throws at runtime */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="truncate font-medium">{name}</div>
            <div className="text-xs font-normal capitalize text-muted-foreground">{auth.role}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Base UI items use onClick. (onSelect is the browser's text-selection event) */}
        <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}