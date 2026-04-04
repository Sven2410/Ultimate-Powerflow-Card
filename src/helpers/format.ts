// ============================================================
// Ultimate Powerflow Card – Formatting Helpers
// ============================================================

/**
 * Format a power value in Watts to a human-readable string.
 * Values below 1000 W are shown as W, 1000+ as kW.
 */
export function formatPower(watts: number | null | undefined): string {
  if (watts === null || watts === undefined || isNaN(watts)) {
    return "—";
  }
  const abs = Math.abs(watts);
  if (abs < 1000) {
    return `${Math.round(abs)} W`;
  }
  const kw = abs / 1000;
  if (kw < 10) {
    return `${kw.toFixed(2)} kW`;
  }
  if (kw < 100) {
    return `${kw.toFixed(1)} kW`;
  }
  return `${Math.round(kw)} kW`;
}

/**
 * Safely parse an entity state string to a number.
 * Returns 0 for unavailable/unknown/missing states.
 */
export function parseEntityValue(
  state: string | undefined | null
): number | null {
  if (!state || state === "unavailable" || state === "unknown" || state === "none") {
    return null;
  }
  const num = parseFloat(state);
  return isNaN(num) ? null : num;
}

/**
 * Format a value that may be null as a display string.
 */
export function formatEntityValue(
  state: string | undefined | null
): string {
  const value = parseEntityValue(state);
  if (value === null) return "—";
  return formatPower(value);
}
