import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/lib/error';
import type { ChurchGroup } from '@/types';
import { DeactivateMemberDialog } from '../components/DeactivateMemberDialog';
import { MemberDetailDrawer } from '../components/MemberDetailDrawer';
import { MemberDirectoryTable } from '../components/MemberDirectoryTable';
import { MemberFilters } from '../components/MemberFilters';
import { MemberFormModal } from '../components/MemberFormModal';
import { useMembers } from '../hooks/useMembers';
import type { MemberDetail, StatusFilter } from '../services/memberService';

const PAGE_SIZE = 25;

type DialogState =
  | { kind: 'add' }
  | { kind: 'edit'; member: MemberDetail }
  | { kind: 'status'; member: MemberDetail }
  | null;

export default function MembersPage() {
  const [searchText, setSearchText] = useState('');
  const search = useDebounce(searchText, 300);
  const [church, setChurch] = useState<ChurchGroup | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [page, setPage] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const members = useMembers({ search, church, status, page, pageSize: PAGE_SIZE });
  const total = members.data?.total ?? 0;

  // If the last page empties (e.g. after deactivating its only member), step back a page
  useEffect(() => {
    if (members.data && members.data.rows.length === 0 && page > 0) {
      setPage(Math.max(Math.ceil(members.data.total / PAGE_SIZE) - 1, 0));
    }
  }, [members.data, page]);

  /** Close the modal and go back to that member's drawer (so the admin never loses their place). */
  const closeDialog = (returnToId?: string) => {
    setDialog(null);
    if (returnToId) setSelectedId(returnToId);
  };

  const openDialogFromDrawer = (next: DialogState) => {
    setSelectedId(null);
    setDialog(next);
  };

  const hasFilters = searchText.trim() !== '' || church !== 'all' || status !== 'active';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Members"
        description={members.data ? `${total} ${total === 1 ? 'member' : 'members'}` : 'Everyone on the list'}
        actions={
          <>
            <Link to={ROUTES.admin.membersImport} className={buttonVariants({ variant: 'outline' })}>
              <Upload className="mr-2 size-4" />
              Import CSV
            </Link>
            <Button onClick={() => setDialog({ kind: 'add' })}>
              <Plus className="mr-2 size-4" />
              Add member
            </Button>
          </>
        }
      />

      <MemberFilters
        search={searchText}
        onSearchChange={(value) => {
          setSearchText(value);
          setPage(0);
        }}
        church={church}
        onChurchChange={(value) => {
          setChurch(value);
          setPage(0);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(0);
        }}
      />

      {members.isPending && (
        <div className="flex justify-center py-16">
          <LoadingSpinner className="size-8" />
        </div>
      )}
      {members.isError && !members.data && (
        <ErrorState message={getErrorMessage(members.error)} onRetry={() => void members.refetch()} />
      )}

      {members.data && (
        <>
          <MemberDirectoryTable rows={members.data.rows} onSelect={setSelectedId} hasFilters={hasFilters} />
          <DataTablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      <MemberDetailDrawer
        memberId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(member) => openDialogFromDrawer({ kind: 'edit', member })}
        onToggleStatus={(member) => openDialogFromDrawer({ kind: 'status', member })}
      />

      <MemberFormModal
        open={dialog?.kind === 'add' || dialog?.kind === 'edit'}
        member={dialog?.kind === 'edit' ? dialog.member : null}
        onOpenChange={(open) => {
          if (!open) closeDialog(dialog?.kind === 'edit' ? dialog.member.id : undefined);
        }}
        onSaved={(id) => closeDialog(id)}
      />

      <DeactivateMemberDialog
        member={dialog?.kind === 'status' ? dialog.member : null}
        onClose={() => closeDialog(dialog?.kind === 'status' ? dialog.member.id : undefined)}
      />
    </div>
  );
}