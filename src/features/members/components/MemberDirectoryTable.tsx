import { Users } from 'lucide-react';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusPill } from '@/components/common/StatusPill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhoneDisplay } from '@/lib/phone';
import type { MemberListRow } from '../services/memberService';

interface MemberDirectoryTableProps {
  rows: MemberListRow[];
  onSelect: (id: string) => void;
  hasFilters: boolean;
}

/** A table on wide screens, a tappable list on phones. */
export function MemberDirectoryTable({ rows, onSelect, hasFilters }: MemberDirectoryTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={hasFilters ? 'No members match' : 'No members yet'}
        description={
          hasFilters
            ? 'Try a different search, or change the church and status filters.'
            : 'Add a member, or import your existing list from a CSV file.'
        }
      />
    );
  }

  return (
    <>
      <div className="hidden rounded-lg border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => onSelect(row.id)}>
                <TableCell>
                  <button
                    type="button"
                    className="text-left font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(row.id);
                    }}
                  >
                    {row.fullName}
                  </button>
                  <div className="font-mono text-xs text-muted-foreground">{row.memberCode}</div>
                </TableCell>
                <TableCell>
                  <ChurchBadge church={row.churchGroup} />
                </TableCell>
                <TableCell className="tabular-nums">{formatPhoneDisplay(row.phone)}</TableCell>
                <TableCell>{row.age ?? '–'}</TableCell>
                <TableCell>
                  <StatusPill active={row.isActive} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y rounded-lg border bg-background md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onSelect(row.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{row.fullName}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <ChurchBadge church={row.churchGroup} />
                  <span>{formatPhoneDisplay(row.phone)}</span>
                </span>
              </span>
              {!row.isActive && <StatusPill active={false} />}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}