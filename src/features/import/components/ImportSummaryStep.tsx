import { Link } from 'react-router-dom';
import { CircleCheck, Download, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import type { CSVImportFlow } from '../hooks/useCSVImport';
import { buildErrorReportCsv, downloadTextFile } from '../utils/buildErrorReport';

export function ImportSummaryStep({ flow }: { flow: CSVImportFlow }) {
  const { state, reset } = flow;
  const { result, validation, csv } = state;
  if (!result || !validation || !csv) return null;

  const skippedRows = [...validation.invalid, ...validation.duplicates].sort((a, b) => a.rowNumber - b.rowNumber);
  const failedRowNumbers = new Set(result.failedBatches.flatMap((batch) => batch.rowNumbers));
  const failedRows = [...validation.valid.filter((row) => failedRowNumbers.has(row.rowNumber))];
  const hasProblems = result.failedBatches.length > 0;

  // One file to fix and re-upload: rows we skipped plus rows that could not be saved
  const toFix = [
    ...skippedRows,
    ...failedRows.map((row) => ({
      rowNumber: row.rowNumber,
      reason: 'Could not be saved. Try importing again.',
      raw: csv.rows[row.rowNumber - 2] ?? {},
    })),
  ].sort((a, b) => a.rowNumber - b.rowNumber);

  const lines: [string, number][] = [
    ['Added', result.created],
    ['Updated', result.updated],
    ['Left unchanged (already members)', result.skippedExisting],
    ['Skipped (problems or duplicates in the file)', skippedRows.length],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {hasProblems ? (
          <TriangleAlert className="size-8 text-amber-500" aria-hidden="true" />
        ) : (
          <CircleCheck className="size-8 text-green-600" aria-hidden="true" />
        )}
        <h2 className="text-xl font-semibold">{hasProblems ? 'Import finished, with some problems' : 'Import finished'}</h2>
      </div>

      <dl className="divide-y rounded-lg border bg-background">
        {lines.map(([label, count]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <dt className="text-sm">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{count.toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      {hasProblems && (
        <div className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm" role="alert">
          <p className="font-medium text-destructive">
            {failedRows.length} {failedRows.length === 1 ? 'member' : 'members'} could not be saved.
          </p>
          {result.failedBatches.map((batch, index) => (
            <p key={index} className="text-muted-foreground">
              {batch.message} (rows {batch.rowNumbers[0]} to {batch.rowNumbers[batch.rowNumbers.length - 1]})
            </p>
          ))}
        </div>
      )}

      {toFix.length > 0 && (
        <Button
          variant="outline"
          onClick={() => downloadTextFile('rows-to-fix.csv', buildErrorReportCsv(toFix, csv.headers))}
        >
          <Download className="mr-2 size-4" />
          Download the {toFix.length} rows to fix
        </Button>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={reset}>
          Import another file
        </Button>
        <Link to={ROUTES.admin.members} className={buttonVariants()}>
          Go to members
        </Link>
      </div>
    </div>
  );
}
