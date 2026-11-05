import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  calls: [] as [string, unknown[]][],
  result: { data: null as unknown, error: null as unknown, count: null as number | null },
}));

vi.mock('@/lib/supabase', () => {
  // A query builder that records every call, and resolves to h.result when awaited
  const builder: Record<string, unknown> = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === 'then') {
          return (resolve: (value: unknown) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(h.result).then(resolve, reject);
        }
        return (...args: unknown[]) => {
          h.calls.push([prop, args]);
          return builder;
        };
      },
    },
  );
  return { supabase: { from: (table: string) => (h.calls.push(['from', [table]]), builder) } };
});

import { createMember, getMemberHistory, listMembers, setMemberStatus, updateMember } from './memberService';

const callsTo = (name: string) => h.calls.filter(([n]) => n === name).map(([, args]) => args);

const filters = { search: '', church: 'all' as const, status: 'all' as const, page: 0, pageSize: 25 };
const dbRow = {
  id: 'm1', member_code: 'MEM-10001', full_name: 'Ada Obi', phone: '+2348031234567', age: 15,
  gender: 'Female', church_group: 'Church 2', status: 'active', created_at: '2026-11-01T08:00:00Z',
};
const form = { fullName: ' Ada Obi ', phone: '0803 123 4567', age: 15, gender: 'Female', churchGroup: 'Church 2', consentGiven: false } as const;

beforeEach(() => {
  h.calls = [];
  h.result = { data: [], error: null, count: 0 };
});

describe('listMembers', () => {
  it('asks for the first page, in a stable order, and returns the total', async () => {
    h.result = { data: [dbRow], error: null, count: 134 };
    const result = await listMembers(filters);
    expect(callsTo('from')[0]).toEqual(['members']);
    expect(callsTo('select')[0][1]).toEqual({ count: 'exact' });
    expect(callsTo('order')).toEqual([['full_name'], ['id']]);
    expect(callsTo('range')).toEqual([[0, 24]]);
    expect(callsTo('eq')).toEqual([]); // no filters
    expect(callsTo('or')).toEqual([]);
    expect(result.total).toBe(134);
    expect(result.rows[0]).toMatchObject({ id: 'm1', fullName: 'Ada Obi', memberCode: 'MEM-10001', churchGroup: 'Church 2', isActive: true });
  });

  it('pages by the page size', async () => {
    await listMembers({ ...filters, page: 2 });
    expect(callsTo('range')).toEqual([[50, 74]]);
    await listMembers({ ...filters, page: 1, pageSize: 10 });
    expect(callsTo('range')[1]).toEqual([10, 19]);
  });

  it('filters by church and status on the server', async () => {
    await listMembers({ ...filters, church: 'Church 2', status: 'active' });
    expect(callsTo('eq')).toEqual([['church_group', 'Church 2'], ['status', 'active']]);
  });

  it('searches names, codes and phone digits using the shared search rules', async () => {
    await listMembers({ ...filters, search: 'ada' });
    expect(callsTo('or')).toEqual([['full_name.ilike.*ada*,member_code.ilike.*ada*']]);
    h.calls = [];
    await listMembers({ ...filters, search: '0803 123' });
    expect(callsTo('or')).toEqual([['phone.ilike.*803123*,member_code.ilike.*803123*']]);
  });

  it('ignores a search that is too short instead of matching everything oddly', async () => {
    await listMembers({ ...filters, search: 'a' });
    expect(callsTo('or')).toEqual([]);
  });

  it('turns an inactive status into isActive: false', async () => {
    h.result = { data: [{ ...dbRow, status: 'inactive' }], error: null, count: 1 };
    expect((await listMembers(filters)).rows[0].isActive).toBe(false);
  });

  it('throws a friendly error when the database refuses', async () => {
    h.result = { data: null, error: { code: '42501', message: 'denied' }, count: null };
    await expect(listMembers(filters)).rejects.toThrow("You don't have permission to do that.");
  });
});

describe('createMember', () => {
  it('saves the normalised phone and trimmed name, and records consent only when given', async () => {
    h.result = { data: { id: 'new1' }, error: null, count: null };
    expect(await createMember(form)).toBe('new1');
    const row = callsTo('insert')[0][0] as Record<string, unknown>;
    expect(row).toMatchObject({ full_name: 'Ada Obi', phone: '+2348031234567', age: 15, gender: 'Female', church_group: 'Church 2', consent_at: null });

    await createMember({ ...form, consentGiven: true });
    expect(typeof (callsTo('insert')[1][0] as Record<string, unknown>).consent_at).toBe('string');
  });

  it('explains a duplicate phone number plainly', async () => {
    h.result = { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "members_phone_unique"' }, count: null };
    await expect(createMember(form)).rejects.toThrow('A member with that phone number already exists.');
  });

  it('refuses a phone number that cannot be normalised', async () => {
    await expect(createMember({ ...form, phone: 'abc' })).rejects.toThrow('valid phone number');
    expect(callsTo('insert')).toEqual([]);
  });
});

describe('updateMember', () => {
  it('updates only the editable details, for that member', async () => {
    h.result = { data: { id: 'm1' }, error: null, count: null };
    await updateMember('m1', form);
    expect(Object.keys(callsTo('update')[0][0] as object).sort()).toEqual(['age', 'church_group', 'full_name', 'gender', 'phone']);
    expect(callsTo('eq')).toEqual([['id', 'm1']]);
  });

  it('treats "no row came back" as not allowed (that is how row-level security says no)', async () => {
    h.result = { data: null, error: null, count: null };
    await expect(updateMember('m1', form)).rejects.toThrow("You don't have permission to change this member.");
  });
});

describe('setMemberStatus', () => {
  it('sets the status', async () => {
    h.result = { data: { id: 'm1' }, error: null, count: null };
    await setMemberStatus('m1', 'inactive');
    expect(callsTo('update')[0][0]).toEqual({ status: 'inactive' });
  });

  it('reports a blocked change', async () => {
    h.result = { data: null, error: null, count: null };
    await expect(setMemberStatus('m1', 'inactive')).rejects.toThrow("don't have permission");
  });
});

describe('getMemberHistory', () => {
  it('returns the latest check-ins and the total', async () => {
    h.result = {
      data: [{ id: 'a1', service_date: '2026-11-01', check_in_time: '2026-11-01T08:05:00Z', check_in_method: 'qr_scan' }],
      error: null,
      count: 31,
    };
    const history = await getMemberHistory('m1');
    expect(callsTo('eq')).toEqual([['member_id', 'm1']]);
    expect(callsTo('order')).toEqual([['service_date', { ascending: false }]]);
    expect(callsTo('limit')).toEqual([[20]]);
    expect(history).toEqual({
      rows: [{ id: 'a1', serviceDate: '2026-11-01', checkInTime: '2026-11-01T08:05:00Z', method: 'qr_scan' }],
      total: 31,
    });
  });
});
