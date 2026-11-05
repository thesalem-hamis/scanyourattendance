import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { formatPhoneDisplay } from '@/lib/phone';
import type { CSVImportFlow } from '../hooks/useCSVImport';
import { buildErrorReportCsv, downloadTextFile } from '../utils/buildErrorReport';

const SHOW_ISSUES = 50;
const SHOW_PREVIEW = 8;

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-lg border bg-background p-3 text-center">
      <p
        className={`text-2xl font-bold tabular-nums ${tone === 'good' ? 'text-green-700' : ''} ${tone === 'bad' && value > 0 ? 'text-destructive' : ''}`}
      >
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ValidationPreviewStep({ flow }: { flow: CSVImportFlow }) {
  const { state, setOptions, goTo, startImport } = flow;
  if (!state.csv || !state.validation || !state.existing) return null;

  const { valid, invalid, duplicates } = state.validation;
  const issues = [...invalid, ...duplicates].sort((a, b) => a.rowNumber - b.rowNumber);
  const existingCount = valid.filter((row) => state.existing?.has(row.phone)).length;
  const newCount = valid.length - existingCount;
  const willImport = newCount + (state.options.updateExisting ? existingCount : 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="New members" value={newCount} tone="good" />
        <Stat label="Already members" value={existingCount} />
        <Stat label="Duplicates in file" value={duplicates.length} tone="bad" />
        <Stat label="Rows with problems" value={invalid.length} tone="bad" />
      </div>

      {existingCount > 0 && (
        <fieldset className="space-y-2 rounded-lg border bg-background p-3">
          <legend className="px-1 text-sm font-medium">{existingCount} of these people are already members</legend>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="existing"
              className="mt-0.5 size-4 accent-primary"
              checked={state.options.updateExisting}
              onChange={() => setOptions({ updateExisting: true })}
            />
            <span>Update their details from the file (name, age, gender, church). Their pass stays the same.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="existing"
              className="mt-0.5 size-4 accent-primary"
              checked={!state.options.updateExisting}
              onChange={() => setOptions({ updateExisting: false })}
            />
            <span>Leave them exactly as they are.</span>
          </label>
        </fieldset>
      )}

      {valid.length > 0 && (
        <section className="space-y-2" aria-label="Preview">
          <h3 className="text-sm font-semibold">Preview</h3>
          <div className="overflow-x-auto rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Church</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valid.slice(0, SHOW_PREVIEW).map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                    <TableCell className="font-medium">{row.fullName}</TableCell>
                    <TableCell className="tabular-nums">{formatPhoneDisplay(row.phone)}</TableCell>
                    <TableCell>{row.gender}</TableCell>
                    <TableCell>{row.age ?? '–'}</TableCell>
                    <TableCell>
                      <ChurchBadge church={row.churchGroup} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {valid.length > SHOW_PREVIEW && (
            <p className="text-xs text-muted-foreground">and {valid.length - SHOW_PREVIEW} more.</p>
          )}
        </section>
      )}

      {issues.length > 0 && (
        <section className="space-y-2" aria-label="Rows that will be skipped">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-destructive">
              {issues.length} {issues.length === 1 ? 'row' : 'rows'} will be skipped
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTextFile('rows-to-fix.csv', buildErrorReportCsv(issues, state.csv?.headers ?? []))
              }
            >
              <Download className="mr-2 size-4" />
              Download these rows
            </Button>
          </div>
          <ul className="divide-y rounded-lg border bg-background text-sm">
            {issues.slice(0, SHOW_ISSUES).map((issue) => (
              <li key={issue.rowNumber} className="flex gap-3 px-3 py-2">
                <span className="w-14 shrink-0 text-muted-foreground">Row {issue.rowNumber}</span>
                <span>{issue.reason}</span>
              </li>
            ))}
          </ul>
          {issues.length > SHOW_ISSUES && (
            <p className="text-xs text-muted-foreground">
              Showing the first {SHOW_ISSUES}. Download the rows to see them all.
            </p>
          )}
        </section>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goTo('map')}>
          Back
        </Button>
        <Button disabled={willImport === 0} onClick={() => void startImport()}>
          {willImport === 0 ? 'Nothing to import' : `Import ${willImport.toLocaleString()} ${willImport === 1 ? 'member' : 'members'}`}
        </Button>
      </div>
    </div>
  );
}