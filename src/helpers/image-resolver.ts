// ============================================================
// Ultimate Powerflow Card – Image Resolver
// ============================================================
// Automatically resolves the correct background image filename
// based on day/night state and enabled features.

export interface ImageResolverOptions {
  isDay: boolean;
  solarEnabled: boolean;
  batteryEnabled: boolean;
  evChargerEnabled: boolean;
  basePath: string;
}

/**
 * Build the correct image filename from enabled features and sun state.
 * Follows the naming convention:
 *   house-energy-{day|night}-grid[-solar-panels][-battery][-ev-charger].png
 */
export function resolveImageFilename(opts: ImageResolverOptions): string {
  const { isDay, solarEnabled, batteryEnabled, evChargerEnabled, basePath } = opts;

  const timeOfDay = isDay ? "day" : "night";

  let name = `house-energy-${timeOfDay}-grid`;

  if (solarEnabled) {
    name += "-solar-panels";
    if (batteryEnabled) {
      name += "-battery";
      if (evChargerEnabled) {
        name += "-ev-charger";
      }
    }
  }

  name += ".png";

  // Ensure base path ends with /
  const cleanBase = basePath.endsWith("/") ? basePath : basePath + "/";

  return `${cleanBase}${name}`;
}

/**
 * Determine whether the sun entity state represents daytime.
 */
export function isDaytime(sunState: string | undefined | null): boolean {
  if (!sunState) return true; // default to day if unknown
  return sunState === "above_horizon";
}
