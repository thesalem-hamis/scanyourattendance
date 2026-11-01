import { z } from 'zod';

const schema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, 'looks too short'),
  VITE_APP_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid or missing environment variables. Check .env.local:\n${problems}`);
}

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
  /** Base URL used to build pass links. No trailing slash. */
  appUrl: parsed.data.VITE_APP_URL.replace(/\/+$/, ''),
} as const;
