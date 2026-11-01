export type AppErrorKind = 'auth' | 'permission' | 'conflict' | 'validation' | 'network' | 'unknown';

/** The only error type the UI ever has to deal with. `message` is always safe to show. */
export class AppError extends Error {
  readonly kind: AppErrorKind;

  constructor(message: string, kind: AppErrorKind = 'unknown', cause?: unknown) {
    super(message, { cause });
    this.name = 'AppError';
    this.kind = kind;
  }

  /** Worth retrying automatically? Only transient problems are. */
  get retryable(): boolean {
    return this.kind === 'network' || this.kind === 'unknown';
  }
}

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  name?: unknown;
  status?: unknown;
}

const asErrorLike = (err: unknown): ErrorLike =>
  typeof err === 'object' && err !== null ? (err as ErrorLike) : {};

/** Turns anything thrown by Supabase / fetch into an AppError with a friendly message. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const e = asErrorLike(err);
  const code = typeof e.code === 'string' ? e.code : '';
  const message = typeof e.message === 'string' ? e.message : '';
  const name = typeof e.name === 'string' ? e.name : '';
  const status = typeof e.status === 'number' ? e.status : undefined;

  // Network problems (offline, DNS, server unreachable)
  if (
    name === 'AuthRetryableFetchError' ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(message)
  ) {
    return new AppError("Can't reach the server. Check your connection and try again.", 'network', err);
  }

  // Auth
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return new AppError('Wrong email or password.', 'auth', err);
  }
  if (code === 'email_not_confirmed') {
    return new AppError("This account isn't confirmed yet. Ask the admin to confirm it.", 'auth', err);
  }
  if (code === 'over_request_rate_limit' || status === 429) {
    return new AppError('Too many attempts. Wait a minute and try again.', 'auth', err);
  }
  if (code === 'PGRST301' || /jwt expired/i.test(message)) {
    return new AppError('Your session has expired. Please sign in again.', 'auth', err);
  }

  // Postgres
  switch (code) {
    case '42501':
      return new AppError("You don't have permission to do that.", 'permission', err);
    case '23505':
      return new AppError('That record already exists.', 'conflict', err);
    case '23503':
      return new AppError('That record is linked to other data and cannot be changed.', 'conflict', err);
    case '23514':
    case '22P02':
      return new AppError("Some of the information isn't valid.", 'validation', err);
    case 'P0001':
      // Our own RAISE EXCEPTION messages in the database functions are written for humans.
      return new AppError(message || "That request isn't allowed.", 'validation', err);
  }

  if (import.meta.env.DEV) console.error('[unmapped error]', err);
  return new AppError('Something went wrong. Please try again.', 'unknown', err);
}

export const getErrorMessage = (err: unknown): string => toAppError(err).message;
