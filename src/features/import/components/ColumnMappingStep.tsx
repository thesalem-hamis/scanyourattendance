import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/common/NativeSelect';
import type { CSVImportFlow } from '../hooks/useCSVImport';
import type { ImportField } from '../types';
import { missingRequired } from '../utils/mapColumns';

interface FieldRow {
  field: ImportField;
  label: string;
  hint?: string;
}

const FIELDS: readonly FieldRow[] = [
  { field: 'fullName', label: 'Full name', hint: 'Or use first and last name below' },
  { field: 'firstName', label: 'First name' },
  { field: 'lastName', label: 'Last name' },
  { field: 'phone', label: 'Phone number' },
  { field: 'gender', label: 'Gender' },
  { field: 'age', label: 'Age (optional)' },
  { field: 'churchGroup', label: 'Church' },
];

export function ColumnMappingStep({ flow }: { flow: CSVImportFlow }) {
  const { state, setMapping, goTo, review } = flow;
  if (!state.csv || !state.mapping) return null;

  const { csv, mapping, options } = state;
  const missing = missingRequired(mapping, options.fixedChurch);
  const sample = (header: string | null) => (header ? (csv.rows.find((row) => row[header])?.[header] ?? '') : '');

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        We matched your columns automatically. Check each one, and fix any that are wrong.
      </p>

      <div className="divide-y rounded-lg border bg-background">
        {FIELDS.map(({ field, label, hint }) => {
          const fixedChurchApplies = field === 'churchGroup' && options.fixedChurch !== null;
          const value = mapping[field];
          return (
            <div key={field} className="grid items-center gap-2 p-3 sm:grid-cols-[10rem_1fr_1fr]">
              <div>
                <Label htmlFor={`map-${field}`}>{label}</Label>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
              </div>
              {fixedChurchApplies ? (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Not needed: everyone goes to {options.fixedChurch}.
                </p>
              ) : (
                <>
                  <NativeSelect
                    id={`map-${field}`}
                    value={value ?? ''}
                    onChange={(event) => setMapping(field, event.target.value || null)}
                  >
                    <option value="">Not in my file</option>
                    {csv.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </NativeSelect>
                  <p className="truncate text-sm text-muted-foreground">
                    {value ? (sample(value) ? `e.g. ${sample(value)}` : 'No values') : ''}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {missing.length > 0 && (
        <p className="text-sm text-destructive" role="status">
          Still needed: {missing.join(', ')}.
        </p>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goTo('upload')}>
          Back
        </Button>
        <Button disabled={missing.length > 0 || state.busy} onClick={() => void review()}>
          {state.busy ? 'Checking…' : 'Check my file'}
        </Button>
      </div>
    </div>
  );
}