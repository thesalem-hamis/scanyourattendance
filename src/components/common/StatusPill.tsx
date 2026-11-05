import { cn } from '@/lib/utils';

/** Active / Inactive. Wording (not just colour) carries the meaning. */
export function StatusPill({ active, className }: { active: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        active ? 'border-green-200 bg-green-50 text-green-700' : 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
