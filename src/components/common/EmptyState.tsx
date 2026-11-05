import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed bg-background px-6 py-12 text-center">
      <div className="max-w-sm space-y-2">
        {Icon && <Icon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />}
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
