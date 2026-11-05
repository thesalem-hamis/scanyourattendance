import { describe, expect, it } from 'vitest';
import { parseQrPayload, tokenFromDetected } from './parseQrPayload';

const TOKEN = '0123456789abcdef0123456789abcdef';
const OTHER = 'fedcba9876543210fedcba9876543210';

describe('tokenFromDetected', () => {
  it('reads a pass link', () => {
    expect(tokenFromDetected([{ rawValue: `https://teens.example.com/pass/${TOKEN}` }])).toBe(TOKEN);
  });

  it('skips unrelated QR codes in the same frame and uses the first valid pass', () => {
    const codes = [
      { rawValue: 'https://example.com/menu' },
      { rawValue: `https://teens.example.com/pass/${OTHER}` },
      { rawValue: `https://teens.example.com/pass/${TOKEN}` },
    ];
    expect(tokenFromDetected(codes)).toBe(OTHER);
  });

  it('returns null when nothing is a pass', () => {
    expect(tokenFromDetected([])).toBeNull();
    expect(tokenFromDetected([{ rawValue: 'WIFI:S:guest;T:WPA;P:secret;;' }])).toBeNull();
  });

  it('exposes the single-payload parser too', () => {
    expect(parseQrPayload(TOKEN)).toBe(TOKEN);
  });
});