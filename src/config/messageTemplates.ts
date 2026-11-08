/**
 * Default wording for outgoing messages. The admin can change it in Settings;
 * until they do (or if loading it fails) these are used.
 */
export const DEFAULT_MESSAGE_TEMPLATES = {
  passShare:
    "Hi {name}! 👋 Here's your digital pass for {church}. Open it and show the QR code at the door each Sunday: {link}",
  absenceFollowUp:
    "Hi {name}! 👋 We missed you on {date}. Hope everything is okay. We'd love to see you next Sunday! 🙏",
} as const;

export type MessageTemplateKey = keyof typeof DEFAULT_MESSAGE_TEMPLATES;

export const MAX_TEMPLATE_LENGTH = 1000;

export interface TemplateMeta {
  /** The key it is stored under in the database. */
  dbKey: string;
  label: string;
  description: string;
  /** The {placeholders} this message can use. */
  placeholders: readonly string[];
  /** Placeholders that must be present for the message to make sense. */
  required: readonly string[];
  /** Example values for the live preview. */
  sample: Record<string, string>;
}

export const TEMPLATE_META: Record<MessageTemplateKey, TemplateMeta> = {
  passShare: {
    dbKey: 'template.pass_share',
    label: 'Sending a pass',
    description: "Sent with a teen's pass link, from the Members page.",
    placeholders: ['name', 'church', 'link'],
    required: ['link'],
    sample: { name: 'Ada', church: 'Church 1', link: 'https://your-site.app/pass/…' },
  },
  absenceFollowUp: {
    dbKey: 'template.absence_followup',
    label: 'Following up an absence',
    description: 'Sent from the Follow-up page to someone who missed a service.',
    placeholders: ['name', 'church', 'date'],
    required: [],
    sample: { name: 'Ada', church: 'Church 1', date: 'Sunday, 1 Nov 2026' },
  },
};

/** Returns a plain-English problem with the wording, or null if it is fine. */
export function validateTemplate(key: MessageTemplateKey, text: string): string | null {
  const meta = TEMPLATE_META[key];
  const trimmed = text.trim();
  if (trimmed === '') return 'The message cannot be empty.';
  if (trimmed.length > MAX_TEMPLATE_LENGTH) return `Keep it under ${MAX_TEMPLATE_LENGTH} characters.`;

  // A misspelt placeholder would be sent to a teen exactly as typed, so catch it here
  const used = [...trimmed.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
  const unknown = used.find((name) => !meta.placeholders.includes(name));
  if (unknown) return `{${unknown}} isn't something this message can fill in. You can use: ${meta.placeholders.map((p) => `{${p}}`).join(', ')}.`;

  const missing = meta.required.find((name) => !used.includes(name));
  if (missing) return `This message must include {${missing}}, or it won't work.`;

  return null;
}
