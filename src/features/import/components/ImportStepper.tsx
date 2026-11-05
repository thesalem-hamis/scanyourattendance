import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportStep } from '../hooks/useCSVImport';

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'map', label: 'Match columns' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
] as const;

/** "importing" is shown as part of the Review step. */
const position = (step: ImportStep): number => (step === 'importing' ? 2 : STEPS.findIndex((s) => s.id === step));

export function ImportStepper({ step }: { step: ImportStep }) {
  const current = position(step);

  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Import progress">
      {STEPS.map((item, index) => {
        const complete = index < current || step === 'done';
        const active = index === current && step !== 'done';
        return (
          <li key={item.id} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full border text-xs font-medium',
                complete && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary text-primary',
                !complete && !active && 'text-muted-foreground',
              )}
            >
              {complete ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn('hidden sm:inline', active ? 'font-medium' : 'text-muted-foreground')}>{item.label}</span>
            {index < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border sm:w-8" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
