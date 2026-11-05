import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
  /** Zero-based page number. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({ page, pageSize, total, onPageChange }: DataTablePaginationProps) {
  if (total === 0) return null;

  const first = page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, total);
  const lastPage = Math.max(Math.ceil(total / pageSize) - 1, 0);

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {first}–{last} of {total}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}