import { useMutation } from '@tanstack/react-query';
import { signInWithPassword } from '../services/authService';
import type { LoginValues } from '../schemas/loginSchema';

/**
 * Signs in. No redirect here on purpose: AuthProvider notices the new session
 * and <RedirectIfAuthed> sends the user to the right home screen.
 */
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: LoginValues) => signInWithPassword(email, password),
  });
}
