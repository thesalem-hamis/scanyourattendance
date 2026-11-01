import { useContext } from 'react';
import { AuthContext, type AuthState } from '../context/authContext';

/** Current auth state. Narrow on `status` before using session / role. */
export function useSession(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSession must be used inside <AuthProvider>');
  return ctx;
}
