import { CHURCHES } from '@/config/churches';
import { cn } from '@/lib/utils';
import type { ChurchGroup } from '@/types';

export function ChurchBadge({ church, className }: { church: ChurchGroup; className?: string }) {
  const style = CHURCHES[church];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style.badge,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
