import { describe, expect, it } from 'vitest';
import { buildPassUrl, extractPassToken, isPassToken } from './qr';

const TOKEN = '0123456789abcdef0123456789abcdef';

describe('isPassToken', () => {
  it('accepts 32 hex characters only', () => {
    expect(isPassToken(TOKEN)).toBe(true);
    expect(isPassToken(TOKEN.toUpperCase())).toBe(true);
    expect(isPassToken(TOKEN.slice(1))).toBe(false);
    expect(isPassToken(`${TOKEN}0`)).toBe(false);
    expect(isPassToken('g'.repeat(32))).toBe(false);
    expect(isPassToken('')).toBe(false);
  });
});

describe('buildPassUrl', () => {
  it('joins base URL and pass path', () => {
    expect(buildPassUrl(TOKEN, 'https://teens.example.com')).toBe(`https://teens.example.com/pass/${TOKEN}`);
  });
  it('tolerates a trailing slash on the base URL', () => {
    expect(buildPassUrl(TOKEN, 'https://teens.example.com/')).toBe(`https://teens.example.com/pass/${TOKEN}`);
  });
  it('round-trips through extractPassToken', () => {
    expect(extractPassToken(buildPassUrl(TOKEN, 'https://teens.example.com'))).toBe(TOKEN);
  });
});

describe('extractPassToken', () => {
  it('reads a bare token, case-insensitively', () => {
    expect(extractPassToken(TOKEN)).toBe(TOKEN);
    expect(extractPassToken(`  ${TOKEN.toUpperCase()}\n`)).toBe(TOKEN);
  });

  it('reads a pass link from any domain', () => {
    expect(extractPassToken(`https://teens.example.com/pass/${TOKEN}`)).toBe(TOKEN);
    expect(extractPassToken(`http://localhost:5173/pass/${TOKEN}/`)).toBe(TOKEN);
    expect(extractPassToken(`https://old-domain.vercel.app/pass/${TOKEN}?utm=1#x`)).toBe(TOKEN);
  });

  it.each([
    [''],
    ['hello world'],
    ['https://example.com'],
    ['https://example.com/pass/'],
    ['https://example.com/pass/not-a-token'],
    [`https://example.com/other/${TOKEN}`],
    [`https://example.com/pass/${TOKEN}/extra`],
    [`javascript:alert(1)//pass/${TOKEN}`],
    [`ftp://example.com/pass/${TOKEN}`],
    [TOKEN.slice(0, 31)],
  ])('%j -> null', (payload) => {
    expect(extractPassToken(payload)).toBeNull();
  });
});
