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

import { addAttendance, getServiceDates, removeAttendance } from './attendanceAdminService';

const calls = (name: string) => h.calls.filter(([n]) => n === name).map(([, a]) => a);

beforeEach(() => {
  h.calls = [];
  h.result = { data: null, error: null };
});

describe('getServiceDates', () => {
  it('asks for the latest dates and returns them', async () => {
    h.result = { data: ['2026-11-01', '2026-10-25'], error: null };
    expect(await getServiceDates(30)).toEqual(['2026-11-01', '2026-10-25']);
    expect(calls('rpc')[0]).toEqual(['service_dates', { p_limit: 30 }]);
  });

  it('refuses an unexpected answer', async () => {
    h.result = { data: ['not-a-date'], error: null };
    await expect(getServiceDates()).rejects.toThrow('Unexpected response');
  });
});

describe('addAttendance', () => {
  it('records a manual check-in for that member and date', async () => {
    await addAttendance({ memberId: 'm1', serviceDate: '2026-10-25' });
    expect(calls('from')[0]).toEqual(['attendance']);
    expect(calls('insert')[0][0]).toEqual({ member_id: 'm1', service_date: '2026-10-25', check_in_method: 'manual_search' });
  });

  it('explains a double check-in plainly', async () => {
    h.result = { data: null, error: { code: '23505', message: 'duplicate key' } };
    await expect(addAttendance({ memberId: 'm1', serviceDate: '2026-10-25' })).rejects.toThrow('already checked in for this date');
  });

  it('will not record a future date, and does not even ask the database', async () => {
    await expect(addAttendance({ memberId: 'm1', serviceDate: '2999-01-01' })).rejects.toThrow('future date');
    expect(calls('insert')).toEqual([]);
  });

  it('rejects a malformed date', async () => {
    await expect(addAttendance({ memberId: 'm1', serviceDate: '25/10/2026' })).rejects.toThrow('valid date');
    expect(calls('insert')).toEqual([]);
  });
});

describe('removeAttendance', () => {
  it('deletes that one record', async () => {
    h.result = { data: { id: 'a1' }, error: null };
    await removeAttendance('a1');
    expect(calls('delete')).toHaveLength(1);
    expect(calls('eq')[0]).toEqual(['id', 'a1']);
  });

  it('treats "no row came back" as not allowed (how row-level security says no)', async () => {
    h.result = { data: null, error: null };
    await expect(removeAttendance('a1')).rejects.toThrow("don't have permission");
  });
});
