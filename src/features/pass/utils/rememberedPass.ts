import { isPassToken } from '@/lib/qr';

const KEY = 'teens-attendance:pass-token';

/** Remembers this phone's pass so a teen can get back to it. Storage can be blocked, so never throw. */
export function rememberPass(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* private mode or storage disabled: nothing to do */
  }
}

export function getRememberedPass(): string | null {
  try {
    const value = localStorage.getItem(KEY);
    return value && isPassToken(value) ? value : null;
  } catch {
    return null;
  }
}