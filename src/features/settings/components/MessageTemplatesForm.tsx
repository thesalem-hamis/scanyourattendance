import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_MESSAGE_TEMPLATES,
  MAX_TEMPLATE_LENGTH,
  TEMPLATE_META,
  validateTemplate,
  type MessageTemplateKey,
} from '@/config/messageTemplates';
import { getErrorMessage } from '@/lib/error';
import { renderTemplate } from '@/lib/messaging';
import { useMessageTemplates, useTemplateMutations } from '../hooks/useMessageTemplates';

const KEYS: MessageTemplateKey[] = ['absenceFollowUp', 'passShare'];

export function MessageTemplatesForm() {
  const { templates, settled } = useMessageTemplates();

  if (!settled) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {KEYS.map((key) => (
        // key includes the saved text, so the editor starts fresh after a save or a reset
        <TemplateEditor key={`${key}:${templates[key]}`} templateKey={key} saved={templates[key]} />
      ))}
    </div>
  );
}

function TemplateEditor({ templateKey, saved }: { templateKey: MessageTemplateKey; saved: string }) {
  const meta = TEMPLATE_META[templateKey];
  const { save, reset } = useTemplateMutations();
  const [text, setText] = useState(saved);

  const problem = validateTemplate(templateKey, text);
  const changed = text !== saved;
  const isDefault = saved === DEFAULT_MESSAGE_TEMPLATES[templateKey];
  const preview = problem ? null : renderTemplate(text.trim(), meta.sample);
  const error = save.error ?? reset.error;

  return (
    <section aria-label={meta.label} className="space-y-3 rounded-lg border bg-background p-4">
      <div>
        <Label htmlFor={`tpl-${templateKey}`} className="text-sm font-semibold">
          {meta.label}
        </Label>
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      </div>

      <Textarea
        id={`tpl-${templateKey}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        aria-invalid={Boolean(problem)}
        aria-describedby={`tpl-${templateKey}-help`}
      />

      <div id={`tpl-${templateKey}-help`} className="space-y-1 text-xs text-muted-foreground">
        <p>
          Fills in for each person: {meta.placeholders.map((p) => `{${p}}`).join(', ')}.
          {meta.required.length > 0 && ` Must include ${meta.required.map((p) => `{${p}}`).join(', ')}.`}
        </p>
        <p className="tabular-nums">
          {text.length} / {MAX_TEMPLATE_LENGTH}
        </p>
      </div>

      {problem && <p className="text-sm text-destructive" role="alert">{problem}</p>}
      {preview && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="mr-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</span>
          {preview}
        </p>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={Boolean(problem) || !changed || save.isPending}
          onClick={() => save.mutate({ key: templateKey, text })}
        >
          {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save wording
        </Button>
        {changed && (
          <Button variant="ghost" onClick={() => setText(saved)}>
            Undo changes
          </Button>
        )}
        {!isDefault && !changed && (
          <Button variant="outline" disabled={reset.isPending} onClick={() => reset.mutate(templateKey)}>
            Back to the built-in wording
          </Button>
        )}
      </div>
    </section>
  );
}
