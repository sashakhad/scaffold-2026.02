import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInDays,
  addDays,
  subDays,
} from 'date-fns';

/**
 * Format a date to a human-readable string.
 * @example formatDate(new Date()) // "Feb 14, 2026"
 */
export function formatDate(date: Date | string, pattern: string = 'MMM d, yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, pattern);
}

/**
 * Format a date with time.
 * @example formatDateTime(new Date()) // "Feb 14, 2026 at 3:45 PM"
 */
export function formatDateTime(date: Date | string): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Get a relative time string (e.g., "3 hours ago", "in 2 days").
 */
export function timeAgo(date: Date | string): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsed, { addSuffix: true });
}

// Re-export commonly used date-fns functions for convenience
export {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInDays,
  addDays,
  subDays,
};
