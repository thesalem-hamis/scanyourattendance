import { supabase } from '@/lib/supabase';
import { toAppError } from '@/lib/error';
import type { Profile } from '@/types';

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw toAppError(error);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAppError(error);
}

/**
 * Returns the staff profile (role) for a logged-in user, or null when the
 * account exists in Supabase Auth but was never given a role.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw toAppError(error);
  return data;
}