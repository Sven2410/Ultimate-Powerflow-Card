// ============================================================
// Ultimate Powerflow Card – Flow Calculator
// ============================================================
// Determines energy flow direction and magnitude between components.

import type { FlowState, PowerValues } from "../types";

/**
 * Calculate all energy flow amounts based on raw sensor values.
 *
 * Priority model:
 *  1. Solar covers total load (household + EV) first
 *  2. Solar excess charges battery next
 *  3. Remaining solar excess exports to grid
 *  4. If load > solar: battery discharges to cover deficit
 *  5. Remaining deficit is grid import
 */
export function calculateFlows(values: PowerValues): FlowState {
  const {
    solar,
    battery_charging,
    battery_discharging,
    ev_charger,
    grid,
    household,
  } = values;

  const safeVal = (v: number) => Math.max(0, v);

  const solar_prod = safeVal(solar);
  const batt_charge = safeVal(battery_charging);
  const batt_discharge = safeVal(battery_discharging);
  const ev_load = safeVal(ev_charger);
  const house_load = safeVal(household);

  const total_load = house_load + ev_load;

  // How much solar goes to load
  const solar_to_load = Math.min(solar_prod, total_load);

  // Remaining solar after covering load
  const solar_remaining = solar_prod - solar_to_load;

  // Solar to battery (up to what battery is charging)
  const solar_to_battery = Math.min(solar_remaining, batt_charge);

  // Solar to grid (what's left after battery)
  const solar_to_grid = Math.max(0, solar_remaining - solar_to_battery);

  // Load deficit after solar
  const load_deficit = total_load - solar_to_load;

  // Battery discharge covers part of deficit
  const battery_to_load = Math.min(batt_discharge, load_deficit);

  // Remaining deficit is grid import
  const grid_to_load = Math.max(0, load_deficit - battery_to_load);

  // Determine grid import vs export
  // Positive grid = import, negative = export (based on solar_to_grid)
  const grid_import = grid_to_load > 1 ? grid_to_load : Math.max(0, safeVal(grid));
  const grid_export = solar_to_grid > 1 ? solar_to_grid : 0;

  // Proportional split solar_to_load → house vs ev
  const solar_to_house =
    total_load > 0
      ? solar_to_load * (house_load / total_load)
      : 0;

  const battery_to_house =
    total_load > 0
      ? battery_to_load * (house_load / total_load)
      : 0;

  return {
    solar_to_house,
    solar_to_battery,
    solar_to_grid,
    battery_to_house,
    grid_to_house: grid_import,
    house_to_ev: ev_load,
    grid_import,
    grid_export,
  };
}

/**
 * Threshold below which a flow is considered inactive (W).
 */
export const FLOW_THRESHOLD = 5;

export function isActive(flow: number): boolean {
  return Math.abs(flow) >= FLOW_THRESHOLD;
}
