export function sanitizeInt(data, min, max, defaultValue) {
  const n = parseInt(data, 10);
  if (Number.isNaN(n)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(n, max));
}
