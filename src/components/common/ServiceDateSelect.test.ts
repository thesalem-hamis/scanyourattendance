import { describe, expect, it } from 'vitest';
import { buildDateOptions } from './ServiceDateSelect';

describe('buildDateOptions', () => {
  it('lists dates newest first and always offers today', () => {
    const options = buildDateOptions(['2026-10-25', '2026-11-01'], '2026-11-05');
    expect(options.map((o) => o.value)).toEqual(['2026-11-05', '2026-11-01', '2026-10-25']);
    expect(options[0].label).toMatch(/\(today\)$/);
    expect(options[1].label).toMatch(/Sunday,? 1 Nov(ember)? 2026/);
  });

  it('does not repeat today when it already has check-ins', () => {
    const options = buildDateOptions(['2026-11-05', '2026-11-01'], '2026-11-05');
    expect(options.map((o) => o.value)).toEqual(['2026-11-05', '2026-11-01']);
  });

  it('keeps a date the admin typed in, in the right place', () => {
    const options = buildDateOptions(['2026-11-01', '2026-10-18'], '2026-11-05', '2026-10-25');
    expect(options.map((o) => o.value)).toEqual(['2026-11-05', '2026-11-01', '2026-10-25', '2026-10-18']);
  });

  it('works with no dates at all', () => {
    expect(buildDateOptions([], '2026-11-05').map((o) => o.value)).toEqual(['2026-11-05']);
  });
});
