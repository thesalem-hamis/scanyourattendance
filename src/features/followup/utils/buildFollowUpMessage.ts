import { CHURCHES } from '@/config/churches';
import { formatServiceDate } from '@/lib/dates';
import { renderTemplate } from '@/lib/messaging';
import type { ChurchGroup } from '@/types';

/** Fills a follow-up message in for one person: {name} {church} {date}. */
export function buildFollowUpMessage(
  template: string,
  person: { fullName: string; churchGroup: ChurchGroup },
  serviceDate: string,
): string {
  return renderTemplate(template, {
    name: person.fullName.trim().split(/\s+/)[0] ?? person.fullName,
    church: CHURCHES[person.churchGroup].label,
    date: formatServiceDate(serviceDate),
  });
}
