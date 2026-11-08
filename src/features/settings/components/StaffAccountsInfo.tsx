import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatServiceDate, toLagosDate } from '@/lib/dates';
import { getErrorMessage } from '@/lib/error';
import { useStaff } from '../hooks/useStaff';

/** Who can log in. Read-only: logins are created in Supabase, not in this app. */
export function StaffAccountsInfo() {
  const { data, isPending, isError, error, refetch } = useStaff();

  return (
    <div className="space-y-3">
      {isPending && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}
      {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />}
      {data && (
        <ul className="divide-y rounded-lg border bg-background" aria-label="People with a login">
          {data.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{person.fullName ?? 'No name set'}</p>
                <p className="text-xs text-muted-foreground">Added {formatServiceDate(toLagosDate(person.createdAt))}</p>
              </div>
              <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize">{person.role}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        To add or remove a login: create or delete the user in Supabase under Authentication → Users, then give them a
        role by adding a row to the <code className="rounded bg-muted px-1">profiles</code> table. A login with no row
        there can sign in but cannot see anything.
      </p>
    </div>
  );
}
