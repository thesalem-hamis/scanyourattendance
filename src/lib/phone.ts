/**
 * Phone numbers are stored in ONE format everywhere: E.164, e.g. +2348031234567.
 * Every form, CSV import and message link goes through these helpers.
 *
 * Numbers without a country code are assumed to be Nigerian. A number from
 * another country must be typed with its +code (e.g. +44...).
 */

const E164 = /^\+[1-9]\d{7,14}$/;
/** Nigerian mobiles: +234 then 10 digits starting 7, 8 or 9 (70x, 80x, 81x, 90x, 91x). */
const NG_MOBILE = /^\+234[789]\d{9}$/;

function validate(e164: string): string | null {
  if (!E164.test(e164)) return null;
  if (e164.startsWith('+234')) return NG_MOBILE.test(e164) ? e164 : null;
  return e164;
}

/** Returns the E.164 form of a phone number, or null if it isn't a usable number. */
export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Only digits, spaces, dashes, dots, brackets and a leading "+" are allowed.
  if (/[^\d\s\-.()+]/.test(raw)) return null;
  if (raw.indexOf('+') > 0) return null;

  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (hasPlus) {
    // "+234 0803..." (trunk zero typed after the country code)
    if (digits.startsWith('2340')) return validate(`+234${digits.slice(4)}`);
    return validate(`+${digits}`);
  }

  // "00234803..." international prefix
  if (digits.startsWith('00')) return validate(`+${digits.slice(2)}`);

  // Nigerian formats without a "+"
  if (digits.length === 14 && digits.startsWith('2340')) return validate(`+234${digits.slice(4)}`);
  if (digits.length === 13 && digits.startsWith('234')) return validate(`+${digits}`);
  if (digits.length === 11 && digits.startsWith('0')) return validate(`+234${digits.slice(1)}`);
  // Excel strips the leading zero from phone columns: 8031234567
  if (digits.length === 10 && /^[789]/.test(digits)) return validate(`+234${digits}`);

  return null;
}

export const isValidPhone = (input: string): boolean => normalizePhone(input) !== null;

/** "+2348031234567" -> "0803 123 4567". Other countries are shown as-is. */
export function formatPhoneDisplay(e164: string): string {
  if (NG_MOBILE.test(e164)) {
    const local = `0${e164.slice(4)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return e164;
}

/** wa.me wants digits only, no "+". */
export const toWhatsAppNumber = (e164: string): string => e164.replace(/^\+/, '');
