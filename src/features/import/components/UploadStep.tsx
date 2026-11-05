import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/common/NativeSelect';
import { CHURCH_GROUPS } from '@/config/churches';
import { cn } from '@/lib/utils';
import type { ChurchGroup } from '@/types';
import type { CSVImportFlow } from '../hooks/useCSVImport';

export function UploadStep({ flow }: { flow: CSVImportFlow }) {
  const { state, loadFile, setOptions, goTo } = flow;
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void loadFile(file);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-background p-8 text-center transition-colors focus-within:ring-[3px] focus-within:ring-ring/50',
          dragging ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
        )}
      >
        {state.busy ? (
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : state.csv ? (
          <FileSpreadsheet className="size-8 text-primary" aria-hidden="true" />
        ) : (
          <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
        )}
        {state.csv ? (
          <>
            <span className="font-medium">{state.csv.fileName}</span>
            <span className="text-sm text-muted-foreground">
              {state.csv.rows.length.toLocaleString()} rows found. Click to choose a different file.
            </span>
          </>
        ) : (
          <>
            <span className="font-medium">Drop your CSV file here, or click to choose one</span>
            <span className="text-sm text-muted-foreground">One row per member. Up to 5,000 rows.</span>
          </>
        )}
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="CSV file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
            event.target.value = ''; // so choosing the same file again still triggers
          }}
        />
      </label>

      <a
        href="/templates/members-import-template.csv"
        download
        className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
      >
        <Download className="size-4" aria-hidden="true" />
        Download a sample CSV
      </a>

      {state.csv?.warnings.map((warning) => (
        <Alert key={warning}>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}

      <div className="space-y-2">
        <Label htmlFor="import-church">Which church are these members from?</Label>
        <NativeSelect
          id="import-church"
          value={state.options.fixedChurch ?? ''}
          onChange={(event) => setOptions({ fixedChurch: (event.target.value || null) as ChurchGroup | null })}
        >
          <option value="">It's in a column in my file</option>
          {CHURCH_GROUPS.map((group) => (
            <option key={group} value={group}>
              All of them are {group}
            </option>
          ))}
        </NativeSelect>
      </div>

      <label className="flex items-start gap-3 text-sm leading-snug">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-primary"
          checked={state.options.consentConfirmed}
          onChange={(event) => setOptions({ consentConfirmed: event.target.checked })}
        />
        <span>These members (or their parents or guardians) agreed to be on this list. I'll record that for the new members.</span>
      </label>

      <div className="flex justify-end">
        <Button disabled={!state.csv || state.busy} onClick={() => goTo('map')}>
          Continue
        </Button>
      </div>
    </div>
  );
}