import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TEMPLATE_META } from '@/config/messageTemplates';
import { ROUTES } from '@/config/routes';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Whether the wording has been changed for this session only. */
  edited: boolean;
  onReset: () => void;
  /** What the message looks like for the first person on the list. */
  preview: string | null;
}

/** The message that goes out. Changes here apply to this page only; Settings changes it for good. */
export function MessageComposer({ value, onChange, edited, onReset, preview }: MessageComposerProps) {
  return (
    <section aria-label="Message" className="space-y-2 rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="followup-message" className="text-sm font-semibold">
          Message
        </Label>
        <div className="flex items-center gap-3 text-xs">
          {edited && (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              Back to saved wording
            </Button>
          )}
          <Link to={ROUTES.admin.settings} className="text-muted-foreground underline-offset-2 hover:underline">
            Change it for good in Settings
          </Link>
        </div>
      </div>
      <Textarea id="followup-message" value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
      <p className="text-xs text-muted-foreground">
        Fills in for each person: {TEMPLATE_META.absenceFollowUp.placeholders.map((p) => `{${p}}`).join(', ')}.
      </p>
      {preview && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm" aria-label="Preview of the first message">
          <span className="mr-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</span>
          {preview}
        </p>
      )}
    </section>
  );
}
