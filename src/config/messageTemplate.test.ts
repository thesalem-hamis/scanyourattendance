import { describe, expect, it } from 'vitest';
import { DEFAULT_MESSAGE_TEMPLATES, MAX_TEMPLATE_LENGTH, TEMPLATE_META, validateTemplate } from './messageTemplates';

describe('the built-in wording', () => {
  it('passes its own validation', () => {
    expect(validateTemplate('passShare', DEFAULT_MESSAGE_TEMPLATES.passShare)).toBeNull();
    expect(validateTemplate('absenceFollowUp', DEFAULT_MESSAGE_TEMPLATES.absenceFollowUp)).toBeNull();
  });
  it('every placeholder it uses is one the message can fill in', () => {
    for (const key of ['passShare', 'absenceFollowUp'] as const) {
      const used = [...DEFAULT_MESSAGE_TEMPLATES[key].matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const name of used) expect(TEMPLATE_META[key].placeholders).toContain(name);
    }
  });
});

describe('validateTemplate', () => {
  it('refuses empty or blank wording', () => {
    expect(validateTemplate('absenceFollowUp', '')).toBe('The message cannot be empty.');
    expect(validateTemplate('absenceFollowUp', '   \n ')).toBe('The message cannot be empty.');
  });

  it('refuses wording that is too long', () => {
    expect(validateTemplate('absenceFollowUp', 'x'.repeat(MAX_TEMPLATE_LENGTH + 1))).toContain('under 1000');
    expect(validateTemplate('absenceFollowUp', 'x'.repeat(MAX_TEMPLATE_LENGTH))).toBeNull();
  });

  it('catches a misspelt placeholder before it is sent to a teen as-is', () => {
    const problem = validateTemplate('absenceFollowUp', 'Hi {nmae}, we missed you');
    expect(problem).toContain('{nmae}');
    expect(problem).toContain('{name}, {church}, {date}');
  });

  it('only allows the placeholders that make sense for that message', () => {
    expect(validateTemplate('absenceFollowUp', 'Open {link}')).toContain('{link}');
    expect(validateTemplate('passShare', 'Missed {date}? {link}')).toContain('{date}');
  });

  it('a pass message must contain the link', () => {
    expect(validateTemplate('passShare', 'Hi {name}, here is your pass')).toBe('This message must include {link}, or it won\'t work.');
    expect(validateTemplate('passShare', 'Hi {name}: {link}')).toBeNull();
  });

  it('a follow-up message needs no placeholders at all', () => {
    expect(validateTemplate('absenceFollowUp', 'We missed you! 🙏')).toBeNull();
  });

  it('single braces that are not placeholders are left alone', () => {
    expect(validateTemplate('absenceFollowUp', 'We missed you { :( }')).toBeNull();
  });
});
