import { describe, expect, it } from 'vitest';
import { DEFAULT_MESSAGE_TEMPLATES } from '@/config/messageTemplates';
import { buildFollowUpMessage } from './buildFollowUpMessage';

const ada = { fullName: '  Ada   Obi ', churchGroup: 'Church 2' as const };

describe('buildFollowUpMessage', () => {
  it('uses their first name, their church and the date they missed', () => {
    expect(buildFollowUpMessage('Hi {name}, {church} missed you on {date}.', ada, '2026-11-01')).toMatch(
      /^Hi Ada, Church 2 missed you on Sunday,? 1 Nov(ember)? 2026\.$/,
    );
  });

  it('works with the built-in wording and leaves no placeholder behind', () => {
    const message = buildFollowUpMessage(DEFAULT_MESSAGE_TEMPLATES.absenceFollowUp, ada, '2026-11-01');
    expect(message).not.toMatch(/\{\w+\}/);
    expect(message).toContain('Hi Ada!');
  });

  it('handles a single name and a name with accents', () => {
    expect(buildFollowUpMessage('Hi {name}', { fullName: 'Ọlá', churchGroup: 'Church 1' }, '2026-11-01')).toBe('Hi Ọlá');
  });

  it('leaves a placeholder it does not know untouched rather than hiding the mistake', () => {
    expect(buildFollowUpMessage('Hi {name} {oops}', ada, '2026-11-01')).toBe('Hi Ada {oops}');
  });
});