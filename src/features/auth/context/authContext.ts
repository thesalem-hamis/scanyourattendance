import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile, StaffRole } from '@/types';

/**
 * Everything the app needs to know about "who is using me", as one union
 * so TypeScript forces every guard to handle every case.
 *
 *  loading   - still finding out (first load, or fetching the role)
 *  signedOut - nobody logged in
 *  noAccess  - logged in, but no row in `profiles`, so no role and no access
 *  error     - couldn't load the role (network). `retry` tries again
 *  signedIn  - logged in with a role
 */
export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'noAccess'; session: Session }
  | { status: 'error'; retry: () => void }
  | { status: 'signedIn'; session: Session; profile: Profile; role: StaffRole };

export const AuthContext = createContext<AuthState | null>(null);