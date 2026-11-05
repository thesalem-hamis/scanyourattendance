import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { ROUTES } from '@/config/routes';
import { ColumnMappingStep } from '../components/ColumnMappingStep';
import { ImportStepper } from '../components/ImportStepper';
import { ImportSummaryStep } from '../components/ImportSummaryStep';
import { UploadStep } from '../components/UploadStep';
import { ValidationPreviewStep } from '../components/ValidationPreviewStep';
import { useCSVImport } from '../hooks/useCSVImport';

export default function ImportPage() {
  const flow = useCSVImport();
  const { step, progress } = flow.state;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={ROUTES.admin.members}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Members
      </Link>

      <PageHeader title="Import members" description="Add many members at once from a CSV file." />
      <ImportStepper step={step} />

      {step === 'upload' && <UploadStep flow={flow} />}
      {step === 'map' && <ColumnMappingStep flow={flow} />}
      {step === 'review' && <ValidationPreviewStep flow={flow} />}
      {step === 'importing' && (
        <div className="space-y-3 rounded-xl border bg-background p-6 text-center" role="status">
          <p className="font-medium">Importing… please keep this page open.</p>
          <progress className="h-2 w-full accent-primary" max={progress.total || 1} value={progress.done} />
          <p className="text-sm text-muted-foreground tabular-nums">
            {progress.done.toLocaleString()} of {progress.total.toLocaleString()}
          </p>
        </div>
      )}
      {step === 'done' && <ImportSummaryStep flow={flow} />}
    </div>
  );
}
