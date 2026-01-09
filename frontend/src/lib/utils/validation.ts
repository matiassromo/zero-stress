/**
 * Validates if a string is a valid UUID (v4)
 * @param value - The string to validate
 * @returns true if valid UUID, false otherwise
 */
export function isUUID(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates if a string is a valid date in YYYY-MM-DD format
 * @param value - The string to validate
 * @returns true if valid date format, false otherwise
 */
export function isValidDateFormat(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;

  // Check if it's a real date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates if a string is a valid time in HH:mm:ss format
 * @param value - The string to validate
 * @returns true if valid time format, false otherwise
 */
export function isValidTimeFormat(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  return timeRegex.test(value);
}

/**
 * Formats a date object to YYYY-MM-DD string
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date object to HH:mm:ss string
 * @param date - The date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Gets current date in YYYY-MM-DD format
 * @returns Current date string
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Gets current time in HH:mm:ss format
 * @returns Current time string
 */
export function getCurrentTime(): string {
  return formatTime(new Date());
}
