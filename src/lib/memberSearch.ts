/**
 * Turns what someone typed into a PostgREST `or` filter for the members table,
 * or null if it is too short to search. Shared by the usher search and the member directory.
 *
 * Phone numbers are matched on their digits without the leading 0, because the database stores
 * +234 numbers (typing 0803... must still find +234803...).
 */
export function buildSearchFilter(raw: string): string | null {
  // Characters that would break the filter syntax or act as wildcards
  const cleaned = raw
    .replace(/[,()*%\\"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length < 2) return null;

  if (/^[\d\s+\-.]+$/.test(cleaned)) {
    const digits = cleaned.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length < 3) return null;
    return `phone.ilike.*${digits}*,member_code.ilike.*${digits}*`;
  }

  return `full_name.ilike.*${cleaned}*,member_code.ilike.*${cleaned}*`;
}