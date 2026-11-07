import { describe, expect, it } from 'vitest';
import { buildMembership, buildSummary, buildTrend } from './statsService';

describe('buildSummary', () => {
  it('works out each church\'s share and turnout, and the combined total', () => {
    const summary = buildSummary('2026-11-01', [
      { church_group: 'Church 1', attended: 30, roster: 60 },
      { church_group: 'Church 2', attended: 10, roster: 40 },
    ]);
    const [c1, c2] = summary.churches;
    expect(c1).toEqual({ churchGroup: 'Church 1', attended: 30, roster: 60, turnout: 0.5, share: 0.75 });
    expect(c2).toEqual({ churchGroup: 'Church 2', attended: 10, roster: 40, turnout: 0.25, share: 0.25 });
    expect(summary.total).toEqual({ attended: 40, roster: 100, turnout: 0.4 });
    expect(summary.serviceDate).toBe('2026-11-01');
  });

  it('shares add up to 100%', () => {
    const { churches } = buildSummary('2026-11-01', [
      { church_group: 'Church 1', attended: 7, roster: 10 },
      { church_group: 'Church 2', attended: 5, roster: 10 },
    ]);
    expect((churches[0].share ?? 0) + (churches[1].share ?? 0)).toBeCloseTo(1);
  });

  it('has no share, and no divide-by-zero, on a day nobody came', () => {
    const summary = buildSummary('2026-11-08', [
      { church_group: 'Church 1', attended: 0, roster: 60 },
      { church_group: 'Church 2', attended: 0, roster: 40 },
    ]);
    expect(summary.churches.map((c) => c.share)).toEqual([null, null]);
    expect(summary.churches.map((c) => c.turnout)).toEqual([0, 0]);
    expect(summary.total).toEqual({ attended: 0, roster: 100, turnout: 0 });
  });

  it('has no turnout for a church with nobody on its list', () => {
    const summary = buildSummary('2026-11-01', [{ church_group: 'Church 1', attended: 0, roster: 0 }]);
    expect(summary.churches[0].turnout).toBeNull();
    expect(summary.total.turnout).toBeNull();
  });

  it('always lists both churches, even if the server sent only one row', () => {
    const summary = buildSummary('2026-11-01', [{ church_group: 'Church 2', attended: 3, roster: 6 }]);
    expect(summary.churches.map((c) => c.churchGroup)).toEqual(['Church 1', 'Church 2']);
    expect(summary.churches[0]).toMatchObject({ attended: 0, roster: 0, turnout: null, share: 0 });
  });
});

describe('buildTrend', () => {
  const rows = [
    { service_date: '2026-11-01', church_group: 'Church 1' as const, attended: 30 },
    { service_date: '2026-11-01', church_group: 'Church 2' as const, attended: 10 },
    { service_date: '2026-10-25', church_group: 'Church 1' as const, attended: 25 },
    { service_date: '2026-10-25', church_group: 'Church 2' as const, attended: 0 },
  ];

  it('makes one point per date, oldest first, for left-to-right charts', () => {
    const trend = buildTrend(rows);
    expect(trend.map((p) => p.serviceDate)).toEqual(['2026-10-25', '2026-11-01']);
    expect(trend[1]).toEqual({ serviceDate: '2026-11-01', label: '1 Nov', 'Church 1': 30, 'Church 2': 10, total: 40 });
    expect(trend[0]).toMatchObject({ label: '25 Oct', 'Church 1': 25, 'Church 2': 0, total: 25 });
  });

  it('copes with rows in any order and with nothing at all', () => {
    expect(buildTrend([...rows].reverse()).map((p) => p.serviceDate)).toEqual(['2026-10-25', '2026-11-01']);
    expect(buildTrend([])).toEqual([]);
  });
});

describe('buildMembership', () => {
  const row = (g: 'Church 1' | 'Church 2', n: number) => ({
    church_group: g,
    active_members: 10 * n,
    inactive_members: n,
    male_members: 4 * n,
    female_members: 6 * n,
    new_last_7_days: n,
    new_last_30_days: 2 * n,
  });

  it('keeps both churches and adds up a combined row', () => {
    const data = buildMembership([row('Church 1', 3), row('Church 2', 2)]);
    expect(data.churches.map((c) => [c.churchGroup, c.active])).toEqual([['Church 1', 30], ['Church 2', 20]]);
    expect(data.combined).toEqual({
      churchGroup: 'Combined',
      active: 50,
      inactive: 5,
      male: 20,
      female: 30,
      newLast7Days: 5,
      newLast30Days: 10,
    });
  });

  it('shows zeros for a church the server did not mention', () => {
    const data = buildMembership([row('Church 1', 1)]);
    expect(data.churches[1]).toMatchObject({ churchGroup: 'Church 2', active: 0, male: 0 });
  });
});