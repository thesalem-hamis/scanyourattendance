import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  calls: [] as [string, unknown[]][],
  result: { data: null as unknown, error: null as unknown },
}));

vi.mock('@/lib/supabase', () => {
  const builder: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === 'then') return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(h.result).then(res, rej);
        return (...args: unknown[]) => {
          h.calls.push([prop, args]);
          return builder;
        };
      },
    },
  );
  return { supabase: { from: (table: string) => (h.calls.push(['from', [table]]), builder) } };
});

import { DEFAULT_MESSAGE_TEMPLATES } from '@/config/messageTemplates';
import { getStaff, getTemplates, mergeTemplates, resetTemplate, saveTemplate } from './settingsService';

const calls = (name: string) => h.calls.filter(([n]) => n === name).map(([, a]) => a);

beforeEach(() => {
  h.calls = [];
  h.result = { data: null, error: null };
});

describe('mergeTemplates', () => {
  it('uses the built-in wording when nothing is saved', () => {
    expect(mergeTemplates([])).toEqual(DEFAULT_MESSAGE_TEMPLATES);
  });
  it('puts saved wording on top, per message', () => {
    const merged = mergeTemplates([{ key: 'template.absence_followup', value: 'We missed you, {name}!' }]);
    expect(merged.absenceFollowUp).toBe('We missed you, {name}!');
    expect(merged.passShare).toBe(DEFAULT_MESSAGE_TEMPLATES.passShare);
  });
  it('ignores anything that is not usable text', () => {
    const merged = mergeTemplates([
      { key: 'template.pass_share', value: { a: 1 } },
      { key: 'template.absence_followup', value: '   ' },
      { key: 'something.else', value: 'x' },
    ]);
    expect(merged).toEqual(DEFAULT_MESSAGE_TEMPLATES);
  });
});

describe('getTemplates', () => {
  it('reads the saved wording and fills in the rest', async () => {
    h.result = { data: [{ key: 'template.pass_share', value: 'Your pass, {name}: {link}' }], error: null };
    const templates = await getTemplates();
    expect(calls('from')[0]).toEqual(['app_settings']);
    expect(templates.passShare).toBe('Your pass, {name}: {link}');
    expect(templates.absenceFollowUp).toBe(DEFAULT_MESSAGE_TEMPLATES.absenceFollowUp);
  });
});

describe('saveTemplate', () => {
  it('saves trimmed wording under the right key', async () => {
    h.result = { data: { key: 'template.absence_followup' }, error: null };
    await saveTemplate('absenceFollowUp', '  We missed you, {name}!  ');
    expect(calls('upsert')[0]).toEqual([{ key: 'template.absence_followup', value: 'We missed you, {name}!' }, { onConflict: 'key' }]);
  });

  it('refuses bad wording without asking the database', async () => {
    await expect(saveTemplate('absenceFollowUp', 'Hi {nmae}')).rejects.toThrow('{nmae}');
    await expect(saveTemplate('passShare', 'no link here')).rejects.toThrow('{link}');
    await expect(saveTemplate('passShare', '   ')).rejects.toThrow('cannot be empty');
    expect(calls('upsert')).toEqual([]);
  });

  it('treats "no row came back" as not allowed (how row-level security says no)', async () => {
    h.result = { data: null, error: null };
    await expect(saveTemplate('absenceFollowUp', 'Hi {name}')).rejects.toThrow("don't have permission");
  });
});

describe('resetTemplate', () => {
  it('deletes the saved row so the built-in wording is used again', async () => {
    await resetTemplate('passShare');
    expect(calls('delete')).toHaveLength(1);
    expect(calls('eq')[0]).toEqual(['key', 'template.pass_share']);
  });
});

describe('getStaff', () => {
  it('lists the people with a login', async () => {
    h.result = { data: [{ id: 'u1', role: 'admin', full_name: 'Admin', created_at: '2026-10-01T08:00:00Z' }], error: null };
    expect(await getStaff()).toEqual([{ id: 'u1', role: 'admin', fullName: 'Admin', createdAt: '2026-10-01T08:00:00Z' }]);
  });
  it('refuses an unexpected role', async () => {
    h.result = { data: [{ id: 'u1', role: 'superuser', full_name: null, created_at: 'x' }], error: null };
    await expect(getStaff()).rejects.toThrow('Unexpected response');
  });
});
