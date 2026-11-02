import { env } from '@/config/env';
import { ROUTES } from '@/config/routes';

/** A member's secret token: 32 hex characters (a UUID without dashes). */
export const PASS_TOKEN_PATTERN = /^[0-9a-f]{32}$/i;

export const isPassToken = (value: string): boolean => PASS_TOKEN_PATTERN.test(value);

/**
 * The text encoded inside every QR code: the full pass link.
 * A phone's camera app opens it as a normal link, and our scanner extracts the token.
 */
export function buildPassUrl(token: string, baseUrl: string = env.appUrl): string {
  return `${baseUrl.replace(/\/+$/, '')}${ROUTES.pass(token)}`;
}

/**
 * Pulls the token out of whatever a scanner read: a full pass link
 * (any domain) or a bare token. Returns null for anything else.
 */
export function extractPassToken(payload: string): string | null {
  const text = payload.trim();
  if (isPassToken(text)) return text.toLowerCase();

  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const match = url.pathname.match(/^\/pass\/([^/]+)\/?$/);
    if (!match) return null;
    const candidate = decodeURIComponent(match[1]);
    return isPassToken(candidate) ? candidate.toLowerCase() : null;
  } catch {
    return null;
  }
}