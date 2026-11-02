import { isIos } from './pwa';
import { toWhatsAppNumber } from './phone';

export type SmsPlatform = 'ios' | 'other';

export const detectSmsPlatform = (): SmsPlatform => (isIos() ? 'ios' : 'other');

/**
 * WhatsApp click-to-send link. With a phone number it opens that chat;
 * without one WhatsApp lets the person pick who to send it to.
 */
export function buildWhatsAppLink(phoneE164: string | null | undefined, text: string): string {
  const number = phoneE164 ? toWhatsAppNumber(phoneE164) : '';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * SMS link. iOS wants "&body=", Android wants "?body=".
 * With no number the messaging app opens with an empty recipient.
 */
export function buildSmsLink(
  phoneE164: string | null | undefined,
  text: string,
  platform: SmsPlatform = detectSmsPlatform(),
): string {
  const separator = platform === 'ios' ? '&' : '?';
  return `sms:${phoneE164 ?? ''}${separator}body=${encodeURIComponent(text)}`;
}

/** Replaces {placeholders}. Unknown placeholders are left untouched. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(vars, key) ? vars[key] : match,
  );
}
