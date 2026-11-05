/** Attendance is recorded by Lagos calendar day (matches `service_date` in the database). */
const LAGOS = 'Africa/Lagos';

/** Today's date in Lagos as YYYY-MM-DD. */
export function todayInLagos(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LAGOS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** "9:05 am", in Lagos time, from a timestamp. */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: LAGOS,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

/** "Sunday, 1 Nov 2026", from a YYYY-MM-DD service date. */
export function formatServiceDate(serviceDate: string): string {
  // Noon UTC keeps the calendar day the same in every timezone.
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${serviceDate}T12:00:00Z`));
}