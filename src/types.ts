// ============================================================
// Ultimate Powerflow Card – Type Definitions
// ============================================================

export interface UltimatePowerflowCardConfig {
  // Required entities
  grid_power_entity: string;
  household_power_entity: string;

  // Optional entities
  solar_power_entity?: string;
  battery_charging_power_entity?: string;
  battery_discharging_power_entity?: string;
  ev_charger_power_entity?: string;
  sun_entity?: string;
  weather_entity?: string;

  // Feature flags
  solar_enabled?: boolean;
  battery_enabled?: boolean;
  ev_charger_enabled?: boolean;

  // Image configuration
  image_base_path?: string;

  // Colors
  colors?: ColorConfig;

  // Animation
  animation_speed?: "slow" | "normal" | "fast";

  // Advanced label positions (optional)
  label_positions?: LabelPositions;
}

export interface ColorConfig {
  grid?: string;
  solar?: string;
  battery?: string;
  household?: string;
  ev_charger?: string;
}

export interface LabelPositions {
  grid?: LabelPosition;
  household?: LabelPosition;
  solar?: LabelPosition;
  battery?: LabelPosition;
  ev_charger?: LabelPosition;
}

export interface LabelPosition {
  x: number; // percentage 0–100
  y: number; // percentage 0–100
}

export interface FlowState {
  solar_to_house: number;
  solar_to_battery: number;
  solar_to_grid: number;
  battery_to_house: number;
  grid_to_house: number;
  house_to_ev: number;
  grid_import: number;
  grid_export: number;
}

export interface PowerValues {
  solar: number;
  battery_charging: number;
  battery_discharging: number;
  ev_charger: number;
  grid: number;
  household: number;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language: string;
  config: {
    unit_system: {
      length: string;
      mass: string;
      pressure: string;
      temperature: string;
      volume: string;
    };
  };
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface FlowLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  power: number;
  color: string;
  active: boolean;
  reversed?: boolean;
}

export type WeatherCondition =
  | "rainy"
  | "pouring"
  | "snowy"
  | "snowy-rainy"
  | "clear-night"
  | "sunny"
  | "partlycloudy"
  | "cloudy"
  | "windy"
  | "fog"
  | "hail"
  | "lightning"
  | "lightning-rainy"
  | string;
