/**
 * Default wording for outgoing messages. Placeholders: {name} {church} {link}
 * (Phase 7 lets the admin edit these in Settings.)
 */
export const DEFAULT_MESSAGE_TEMPLATES = {
  passShare:
    "Hi {name}! 👋 Here's your digital pass for {church}. Open it and show the QR code at the door each Sunday: {link}",
} as const;

export type MessageTemplateKey = keyof typeof DEFAULT_MESSAGE_TEMPLATES;
