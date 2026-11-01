import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { AuthContext, type AuthState } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // IMPORTANT: only set state in this callback. Calling other supabase
    // methods from inside it can deadlock the client. The role is loaded
    // separately by useProfile once `session` changes.
    // onAuthStateChange fires INITIAL_SESSION on subscribe, so no getSession() needed.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const { data: profile, isError, isPending, refetch } = useProfile(session?.user.id);

  const value = useMemo<AuthState>(() => {
    if (!sessionReady) return { status: 'loading' };
    if (!session) return { status: 'signedOut' };
    if (isError) return { status: 'error', retry: () => void refetch() };
    if (isPending) return { status: 'loading' };
    if (!profile) return { status: 'noAccess', session };
    return { status: 'signedIn', session, profile, role: profile.role };
  }, [sessionReady, session, isError, isPending, profile, refetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}