import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImportRow } from '../types';

const h = vi.hoisted(() => ({
  existingPhones: [] as string[],
  inCalls: [] as string[][],
  upserts: [] as { payload: Record<string, unknown>[]; options: Record<string, unknown> }[],
  upsertResult: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: (_column: string, phones: string[]) => {
          h.inCalls.push(phones);
          return Promise.resolve({
            data: phones.filter((phone) => h.existingPhones.includes(phone)).map((phone) => ({ phone })),
            error: null,
          });
        },
      }),
      upsert: (payload: Record<string, unknown>[], options: Record<string, unknown>) => {
        h.upserts.push({ payload, options });
        return { select: () => h.upsertResult(payload, options) };
      },
    }),
  },
}));

import { BATCH_SIZE, chunk, findExistingPhones, importMembers } from './importService';

const makeRows = (count: number, startAt = 0): ImportRow[] =>
  Array.from({ length: count }, (_, i) => ({
    rowNumber: i + 2 + startAt,
    fullName: `Person ${i + startAt}`,
    phone: `+234803${String(i + startAt).padStart(7, '0')}`,
    age: 15,
    gender: 'Female',
    churchGroup: 'Church 1',
  }));

beforeEach(() => {
  h.existingPhones = [];
  h.inCalls = [];
  h.upserts = [];
  h.upsertResult.mockReset();
  // default: every row in the batch is saved
  h.upsertResult.mockImplementation((payload: unknown[]) =>
    Promise.resolve({ data: payload.map((_, i) => ({ id: String(i) })), error: null }),
  );
});

describe('chunk', () => {
  it('splits into pieces of at most `size`', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});

describe('findExistingPhones', () => {
  it('asks in batches of 200 and combines the answers', async () => {
    const phones = makeRows(450).map((row) => row.phone);
    h.existingPhones = [phones[3], phones[250], phones[449]];
    const found = await findExistingPhones(phones);
    expect(h.inCalls.map((call) => call.length)).toEqual([200, 200, 50]);
    expect([...found].sort()).toEqual([...h.existingPhones].sort());
  });
});

describe('importMembers', () => {
  it('saves new members in batches of 500 without overwriting anyone who appeared meanwhile', async () => {
    const result = await importMembers({ rows: makeRows(1200), existing: new Set(), updateExisting: true, consentConfirmed: false });
    expect(BATCH_SIZE).toBe(500);
    expect(h.upserts.map((u) => u.payload.length)).toEqual([500, 500, 200]);
    expect(h.upserts.every((u) => u.options.onConflict === 'phone' && u.options.ignoreDuplicates === true)).toBe(true);
    expect(result).toEqual({ created: 1200, updated: 0, skippedExisting: 0, failedBatches: [] });
  });

  it('updates existing members in separate batches that DO overwrite details', async () => {
    const rows = makeRows(10);
    const existing = new Set(rows.slice(0, 4).map((row) => row.phone));
    const result = await importMembers({ rows, existing, updateExisting: true, consentConfirmed: false });

    const newBatch = h.upserts.find((u) => u.options.ignoreDuplicates === true);
    const updateBatch = h.upserts.find((u) => u.options.ignoreDuplicates !== true);
    expect(newBatch?.payload).toHaveLength(6);
    expect(updateBatch?.payload).toHaveLength(4);
    expect(result).toMatchObject({ created: 6, updated: 4, skippedExisting: 0 });
  });

  it('leaves existing members alone when asked to', async () => {
    const rows = makeRows(10);
    const existing = new Set(rows.slice(0, 4).map((row) => row.phone));
    const result = await importMembers({ rows, existing, updateExisting: false, consentConfirmed: false });
    expect(h.upserts).toHaveLength(1); // only the new people were sent
    expect(result).toMatchObject({ created: 6, updated: 0, skippedExisting: 4 });
  });

  it('never sends the pass, code or status, so existing passes keep working', async () => {
    const rows = makeRows(3);
    await importMembers({ rows, existing: new Set([rows[0].phone]), updateExisting: true, consentConfirmed: true });
    for (const { payload } of h.upserts) {
      for (const row of payload) {
        expect(Object.keys(row).sort()).not.toEqual(expect.arrayContaining(['qr_token']));
        expect(row).not.toHaveProperty('qr_token');
        expect(row).not.toHaveProperty('member_code');
        expect(row).not.toHaveProperty('status');
        expect(row).not.toHaveProperty('id');
      }
    }
  });

  it('records consent only for people being added now, never rewriting it for existing members', async () => {
    const rows = makeRows(4);
    const existing = new Set([rows[0].phone, rows[1].phone]);
    await importMembers({ rows, existing, updateExisting: true, consentConfirmed: true });

    const newPayload = h.upserts.find((u) => u.options.ignoreDuplicates === true)!.payload;
    const updatePayload = h.upserts.find((u) => u.options.ignoreDuplicates !== true)!.payload;
    expect(newPayload.every((row) => typeof row.consent_at === 'string')).toBe(true);
    expect(updatePayload.some((row) => 'consent_at' in row)).toBe(false);
  });

  it('does not record consent when not confirmed', async () => {
    await importMembers({ rows: makeRows(2), existing: new Set(), updateExisting: true, consentConfirmed: false });
    expect(h.upserts[0].payload.some((row) => 'consent_at' in row)).toBe(false);
  });

  it('counts people who registered themselves in the meantime as already members', async () => {
    // database says only 7 of the 10 were actually inserted
    h.upsertResult.mockImplementation(() => Promise.resolve({ data: Array.from({ length: 7 }, (_, i) => ({ id: String(i) })), error: null }));
    const result = await importMembers({ rows: makeRows(10), existing: new Set(), updateExisting: true, consentConfirmed: false });
    expect(result).toMatchObject({ created: 7, skippedExisting: 3 });
  });

  it('keeps going when one batch fails, and says exactly which rows were lost', async () => {
    h.upsertResult
      .mockImplementationOnce((payload: unknown[]) => Promise.resolve({ data: payload.map(() => ({ id: 'x' })), error: null }))
      .mockImplementationOnce(() => Promise.resolve({ data: null, error: { code: '42501', message: 'denied' } }))
      .mockImplementationOnce((payload: unknown[]) => Promise.resolve({ data: payload.map(() => ({ id: 'x' })), error: null }));

    const result = await importMembers({ rows: makeRows(1200), existing: new Set(), updateExisting: true, consentConfirmed: false });
    expect(result.created).toBe(700); // batches 1 and 3
    expect(result.failedBatches).toHaveLength(1);
    expect(result.failedBatches[0].message).toBe("You don't have permission to do that.");
    expect(result.failedBatches[0].rowNumbers).toHaveLength(500);
    expect(result.failedBatches[0].rowNumbers[0]).toBe(502); // row numbers are spreadsheet rows
  });

  it('reports progress after every batch', async () => {
    const progress: [number, number][] = [];
    await importMembers({
      rows: makeRows(1200),
      existing: new Set(),
      updateExisting: true,
      consentConfirmed: false,
      onProgress: (done, total) => progress.push([done, total]),
    });
    expect(progress).toEqual([[0, 1200], [500, 1200], [1000, 1200], [1200, 1200]]);
  });

  it('does nothing for an empty list', async () => {
    const result = await importMembers({ rows: [], existing: new Set(), updateExisting: true, consentConfirmed: false });
    expect(h.upserts).toHaveLength(0);
    expect(result).toEqual({ created: 0, updated: 0, skippedExisting: 0, failedBatches: [] });
  });
});
