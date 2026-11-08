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
  return {
    supabase: {
      from: (table: string) => (h.calls.push(['from', [table]]), builder),
      rpc: (name: string, args: unknown) => (h.calls.push(['rpc', [name, args]]), Promise.resolve(h.result)),
    },
  };
});

import { getAbsentees, markContacted, unmarkContacted } from './followupService';

const calls = (name: string) => h.calls.filter(([n]) => n === name).map(([, a]) => a);
const dbRow = {
  member_id: 'm1', member_code: 'MEM-10001', full_name: 'Ada Obi', phone: '+2348031234567', church_group: 'Church 2',
  last_attended: '2026-10-25', contacted_at: null, contacted_channel: null,
};

beforeEach(() => {
  h.calls = [];
  h.result = { data: null, error: null };
});

describe('getAbsentees', () => {
  it('asks for both churches by leaving the church out', async () => {
    h.result = { data: [dbRow], error: null };
    const rows = await getAbsentees('2026-11-01', 'all');
    expect(calls('rpc')[0]).toEqual(['absentees', { p_date: '2026-11-01' }]);
    expect(rows).toEqual([
      { memberId: 'm1', memberCode: 'MEM-10001', fullName: 'Ada Obi', phone: '+2348031234567', churchGroup: 'Church 2', lastAttended: '2026-10-25', contactedAt: null, contactedChannel: null },
    ]);
  });

  it('asks for one church when filtered', async () => {
    h.result = { data: [], error: null };
    await getAbsentees('2026-11-01', 'Church 1');
    expect(calls('rpc')[0]).toEqual(['absentees', { p_date: '2026-11-01', p_church: 'Church 1' }]);
  });

  it('carries over who has been contacted, and how', async () => {
    h.result = { data: [{ ...dbRow, contacted_at: '2026-11-02T08:15:00Z', contacted_channel: 'whatsapp', last_attended: null }], error: null };
    const [row] = await getAbsentees('2026-11-01', 'all');
    expect(row).toMatchObject({ contactedAt: '2026-11-02T08:15:00Z', contactedChannel: 'whatsapp', lastAttended: null });
  });

  it('refuses an answer it does not recognise instead of guessing', async () => {
    h.result = { data: [{ ...dbRow, contacted_channel: 'carrier pigeon' }], error: null };
    await expect(getAbsentees('2026-11-01', 'all')).rejects.toThrow('Unexpected response');
  });

  it('turns a refusal into a friendly message', async () => {
    h.result = { data: null, error: { code: '42501', message: 'denied' } };
    await expect(getAbsentees('2026-11-01', 'all')).rejects.toThrow("You don't have permission");
  });
});

describe('markContacted', () => {
  it('saves one record per member per date, updating it if it exists', async () => {
    await markContacted({ memberId: 'm1', serviceDate: '2026-11-01', channel: 'sms' });
    expect(calls('from')[0]).toEqual(['followups']);
    expect(calls('upsert')[0]).toEqual([
      { member_id: 'm1', service_date: '2026-11-01', channel: 'sms' },
      { onConflict: 'member_id,service_date' },
    ]);
  });

  it('never sends who or when: the database stamps those itself', async () => {
    await markContacted({ memberId: 'm1', serviceDate: '2026-11-01', channel: 'call' });
    const row = calls('upsert')[0][0] as Record<string, unknown>;
    expect(row).not.toHaveProperty('contacted_by');
    expect(row).not.toHaveProperty('contacted_at');
  });

  it('reports a refusal', async () => {
    h.result = { data: null, error: { code: '42501', message: 'denied' } };
    await expect(markContacted({ memberId: 'm1', serviceDate: '2026-11-01', channel: 'sms' })).rejects.toThrow("don't have permission");
  });
});

describe('unmarkContacted', () => {
  it('removes just that member\'s record for that date', async () => {
    await unmarkContacted({ memberId: 'm1', serviceDate: '2026-11-01' });
    expect(calls('delete')).toHaveLength(1);
    expect(calls('eq')).toEqual([['member_id', 'm1'], ['service_date', '2026-11-01']]);
  });
});