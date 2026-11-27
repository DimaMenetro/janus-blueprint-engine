/**
 * READING THE STORE'S TIMESTAMPS (measured 2026-11-27).
 * `created_date` and `updated_date` are written by the store in UTC, and a read returns them with NO zone
 * designator ("2026-11-27T02:32:49.133000"). JavaScript reads a date-time without a zone as LOCAL time, so
 * `new Date(run.created_date)` is wrong by the reader's UTC offset: in Chicago every run appeared six hours later
 * than it happened. A date-time the app itself writes carries its "Z" and comes back exactly as written.
 * `instantOf` reads either form as the instant it is. A value that is not a date-time yields null.
 */
const ZONED = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function instantOf(value) {
  if (typeof value !== "string" || !DATE_TIME.test(value)) return null;
  const instant = new Date(ZONED.test(value) ? value : `${value}Z`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}